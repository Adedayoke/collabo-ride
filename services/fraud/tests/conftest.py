import os

# Tests never depend on a local .env file.
os.environ.update(
    {
        "APP_ENV": "test",
        "SERVICE_NAME": "fraud",
        "PORT": "8087",
        "GATEWAY_CONTEXT_KEY": "test-gateway-context-key-0123456789abcdef",
        "DATABASE_URL": "postgres://fraud:test@localhost:5432/collabo",
        "VALKEY_DURABLE_URL": "redis://localhost:6380",
    }
)
