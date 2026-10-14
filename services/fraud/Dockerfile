# Python: slim image with uv sync --frozen, non root (spec 0009, Containers).
FROM python:3.14-slim
COPY --from=ghcr.io/astral-sh/uv:0.13.0 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PROJECT_ENVIRONMENT=/app/.venv
WORKDIR /app
COPY services/fraud/pyproject.toml services/fraud/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY services/fraud/app ./app
RUN useradd --system --uid 10001 fraud && chown -R fraud /app
USER fraud
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8087
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8087}"]
