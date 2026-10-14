"""Gateway signed request context (spec 0009, Identity and trust).

Must match the TS and Go implementations; all three test against
packages/contracts/test-vectors/context-signature.json.
"""

import hashlib
import hmac
import re
import time
from collections.abc import Mapping
from dataclasses import dataclass

MAX_SKEW_SECONDS = 30
ROLES = frozenset({"rider", "driver", "staff", "system"})

HEADER_USER_ID = "x-user-id"
HEADER_ROLE = "x-user-role"
HEADER_PHONE_VERIFIED = "x-phone-verified"
HEADER_REQUEST_ID = "x-request-id"
HEADER_TIMESTAMP = "x-ctx-ts"
HEADER_SIGNATURE = "x-ctx-sig"

_DIGITS = re.compile(r"^\d+$")
_HEX = re.compile(r"^[0-9a-fA-F]*$")


@dataclass(frozen=True)
class RequestContext:
    user_id: str
    role: str
    phone_verified: bool
    request_id: str
    timestamp: int


class ContextError(Exception):
    pass


def payload(ctx: RequestContext) -> str:
    flag = "true" if ctx.phone_verified else "false"
    return "|".join([ctx.user_id, ctx.role, flag, ctx.request_id, str(ctx.timestamp)])


def sign(ctx: RequestContext, key: str) -> str:
    """Hex HMAC SHA256 of uid|role|phoneVerified|reqId|ts."""
    return hmac.new(key.encode(), payload(ctx).encode(), hashlib.sha256).hexdigest()


def verify(headers: Mapping[str, str], key: str, now: int | None = None) -> RequestContext:
    """Check the context headers; `headers` must be case insensitive or lower case."""
    now = int(time.time()) if now is None else now
    values = [headers.get(h) for h in (HEADER_USER_ID, HEADER_ROLE, HEADER_PHONE_VERIFIED,
                                       HEADER_REQUEST_ID, HEADER_TIMESTAMP, HEADER_SIGNATURE)]
    if not all(values):
        raise ContextError("missing context headers")
    uid, role, flag, request_id, ts, sig = values  # type: ignore[misc]
    if role not in ROLES:
        raise ContextError("unknown role")
    if flag not in ("true", "false"):
        raise ContextError("bad phone verified flag")
    if not _DIGITS.match(ts):
        raise ContextError("bad timestamp")
    ctx = RequestContext(uid, role, flag == "true", request_id, int(ts))
    if abs(now - ctx.timestamp) > MAX_SKEW_SECONDS:
        raise ContextError("stale timestamp")
    if not _HEX.match(sig) or not hmac.compare_digest(sig.lower(), sign(ctx, key)):
        raise ContextError("bad signature")
    return ctx
