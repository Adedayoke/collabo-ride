import re
import time

from fastapi.testclient import TestClient

from app import ctxsig
from app.main import app, settings

client = TestClient(app)

UUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")


def signed(
    role: str = "system", request_id: str = "req-py-1", key: str | None = None, ts: int | None = None
) -> dict[str, str]:
    ctx = ctxsig.RequestContext("usr_1", role, True, request_id, int(time.time()) if ts is None else ts)
    return {
        ctxsig.HEADER_USER_ID: ctx.user_id,
        ctxsig.HEADER_ROLE: ctx.role,
        ctxsig.HEADER_PHONE_VERIFIED: "true",
        ctxsig.HEADER_REQUEST_ID: ctx.request_id,
        ctxsig.HEADER_TIMESTAMP: str(ctx.timestamp),
        ctxsig.HEADER_SIGNATURE: ctxsig.sign(ctx, key or settings.gateway_context_key),
    }


def test_health_is_open() -> None:
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "service": "fraud"}
    assert res.headers["x-request-id"]


def test_other_routes_need_signed_context() -> None:
    res = client.get("/anything")
    assert res.status_code == 401
    assert res.json()["code"] == "BAD_CONTEXT"


def test_missing_context_uses_the_error_shape_and_keeps_a_request_id() -> None:
    res = client.get("/anything", headers={"x-request-id": "rejected-1"})
    assert res.json() == {"code": "BAD_CONTEXT", "message": "missing context headers"}
    assert res.headers["x-request-id"] == "rejected-1"


def test_health_echoes_the_caller_request_id() -> None:
    res = client.get("/health", headers={"x-request-id": "trace-me-123"})
    assert res.headers["x-request-id"] == "trace-me-123"


def test_generates_a_uuid_when_request_id_is_missing_or_too_long() -> None:
    assert UUID.match(client.get("/health").headers["x-request-id"])
    assert UUID.match(client.get("/health", headers={"x-request-id": "x" * 129}).headers["x-request-id"])


def test_rejects_a_context_signed_with_another_key() -> None:
    res = client.get("/anything", headers=signed(key="another-key-that-is-long-enough-000000"))
    assert res.status_code == 401
    assert res.json() == {"code": "BAD_CONTEXT", "message": "bad signature"}


def test_rejects_a_context_whose_role_was_changed() -> None:
    res = client.get("/anything", headers={**signed(role="rider"), ctxsig.HEADER_ROLE: "staff"})
    assert res.status_code == 401
    assert res.json()["message"] == "bad signature"


def test_rejects_a_stale_context() -> None:
    res = client.get("/anything", headers=signed(ts=int(time.time()) - 120))
    assert res.status_code == 401
    assert res.json()["message"] == "stale timestamp"


def test_unknown_route_with_valid_context_is_not_found_in_the_error_shape() -> None:
    res = client.get("/nope", headers=signed())
    assert res.status_code == 404
    assert res.json() == {"code": "NOT_FOUND", "message": "Route not found"}
    assert res.headers["x-request-id"] == "req-py-1"


def test_wrong_method_on_health_still_uses_the_error_shape() -> None:
    res = client.post("/health", headers={"x-request-id": "wrong-method-1"})
    assert res.status_code == 405
    assert res.json() == {"code": "METHOD_NOT_ALLOWED", "message": "Method not allowed"}
    assert res.headers["x-request-id"] == "wrong-method-1"


def test_api_docs_are_not_exposed() -> None:
    for path in ("/docs", "/redoc", "/openapi.json"):
        assert client.get(path, headers=signed()).status_code == 404
