import uuid
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app import ctxsig
from app.config import Settings

settings = Settings()  # type: ignore[call-arg]  # values come from the environment

app = FastAPI(title="fraud", docs_url=None, redoc_url=None, openapi_url=None)

PUBLIC_PATHS = {"/health"}


def error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse({"code": code, "message": message}, status_code=status)


@app.middleware("http")
async def request_context(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    request_id = request.headers.get(ctxsig.HEADER_REQUEST_ID)
    if not request_id or len(request_id) > 128:
        request_id = str(uuid.uuid4())
    request.state.request_id = request_id

    if request.url.path not in PUBLIC_PATHS:
        try:
            request.state.ctx = ctxsig.verify(request.headers, settings.gateway_context_key)
        except ctxsig.ContextError as exc:
            response = error(401, "BAD_CONTEXT", str(exc))
            response.headers[ctxsig.HEADER_REQUEST_ID] = request_id
            return response

    response = await call_next(request)
    response.headers[ctxsig.HEADER_REQUEST_ID] = request_id
    return response


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.service_name}


@app.exception_handler(StarletteHTTPException)
async def http_error(_request: Request, exc: StarletteHTTPException) -> JSONResponse:
    # FastAPI's default body is {"detail": ...}; every service answers { code, message }.
    if exc.status_code == 404:
        return error(404, "NOT_FOUND", "Route not found")
    if exc.status_code == 405:
        return error(405, "METHOD_NOT_ALLOWED", "Method not allowed")
    return error(exc.status_code, "HTTP_ERROR", str(exc.detail))
