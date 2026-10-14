import json
from pathlib import Path
from typing import Any

import pytest

from app import ctxsig

VECTORS = json.loads(
    (Path(__file__).parents[3] / "packages/contracts/test-vectors/context-signature.json").read_text("utf-8")
)


def headers(case: dict[str, Any]) -> dict[str, str]:
    return {
        ctxsig.HEADER_USER_ID: case["uid"],
        ctxsig.HEADER_ROLE: case["role"],
        ctxsig.HEADER_PHONE_VERIFIED: "true" if case["phoneVerified"] else "false",
        ctxsig.HEADER_REQUEST_ID: case["reqId"],
        ctxsig.HEADER_TIMESTAMP: str(case["ts"]),
        ctxsig.HEADER_SIGNATURE: case["sig"],
    }


@pytest.mark.parametrize("case", VECTORS["valid"], ids=lambda c: c["uid"])
def test_sign_matches_vectors(case: dict[str, Any]) -> None:
    ctx = ctxsig.RequestContext(case["uid"], case["role"], case["phoneVerified"], case["reqId"], case["ts"])
    assert ctxsig.sign(ctx, VECTORS["key"]) == case["sig"]
    assert ctxsig.verify(headers(case), VECTORS["key"], now=case["ts"]) == ctx


@pytest.mark.parametrize("case", VECTORS["invalid"], ids=lambda c: c["name"])
def test_rejects_invalid_vectors(case: dict[str, Any]) -> None:
    with pytest.raises(ctxsig.ContextError):
        ctxsig.verify(headers(case), case.get("key", VECTORS["key"]), now=case["ts"])


def test_skew_window() -> None:
    case = VECTORS["valid"][0]
    with pytest.raises(ctxsig.ContextError):
        ctxsig.verify(headers(case), VECTORS["key"], now=case["ts"] + 31)
    ctxsig.verify(headers(case), VECTORS["key"], now=case["ts"] - 30)


@pytest.mark.parametrize(
    "header",
    [
        ctxsig.HEADER_USER_ID,
        ctxsig.HEADER_ROLE,
        ctxsig.HEADER_PHONE_VERIFIED,
        ctxsig.HEADER_REQUEST_ID,
        ctxsig.HEADER_TIMESTAMP,
        ctxsig.HEADER_SIGNATURE,
    ],
)
def test_missing_header_is_reported(header: str) -> None:
    case = VECTORS["valid"][0]
    h = headers(case)
    del h[header]
    with pytest.raises(ctxsig.ContextError, match="missing context headers"):
        ctxsig.verify(h, VECTORS["key"], now=case["ts"])


def test_empty_header_counts_as_missing() -> None:
    case = VECTORS["valid"][0]
    with pytest.raises(ctxsig.ContextError, match="missing context headers"):
        ctxsig.verify({**headers(case), ctxsig.HEADER_USER_ID: ""}, VECTORS["key"], now=case["ts"])


@pytest.mark.parametrize(
    ("header", "value", "reason"),
    [
        (ctxsig.HEADER_ROLE, "admin", "unknown role"),
        (ctxsig.HEADER_PHONE_VERIFIED, "TRUE", "bad phone verified flag"),
        (ctxsig.HEADER_PHONE_VERIFIED, "1", "bad phone verified flag"),
        (ctxsig.HEADER_TIMESTAMP, "-1760400000", "bad timestamp"),
        (ctxsig.HEADER_TIMESTAMP, "1760400000.5", "bad timestamp"),
        (ctxsig.HEADER_SIGNATURE, "z" * 64, "bad signature"),
    ],
)
def test_malformed_header_is_rejected_with_its_reason(header: str, value: str, reason: str) -> None:
    case = VECTORS["valid"][0]
    with pytest.raises(ctxsig.ContextError, match=reason):
        ctxsig.verify({**headers(case), header: value}, VECTORS["key"], now=case["ts"])


@pytest.mark.parametrize("suffix", ["zz", "0"], ids=["trailing non hex", "odd nibble"])
def test_signature_with_extra_characters_is_rejected(suffix: str) -> None:
    case = VECTORS["valid"][0]
    with pytest.raises(ctxsig.ContextError, match="bad signature"):
        ctxsig.verify({**headers(case), ctxsig.HEADER_SIGNATURE: case["sig"] + suffix}, VECTORS["key"], now=case["ts"])


def test_upper_case_hex_signature_verifies() -> None:
    case = VECTORS["valid"][0]
    ctxsig.verify({**headers(case), ctxsig.HEADER_SIGNATURE: case["sig"].upper()}, VECTORS["key"], now=case["ts"])
