import pytest
from pydantic import ValidationError

from app.config import Settings

REQUIRED = {
    "SERVICE_NAME": "fraud",
    "PORT": "8087",
    "GATEWAY_CONTEXT_KEY": "test-gateway-context-key-0123456789abcdef",
    "DATABASE_URL": "postgres://fraud:test@localhost:5432/collabo",
    "VALKEY_DURABLE_URL": "redis://localhost:6380",
}


@pytest.fixture
def env(monkeypatch: pytest.MonkeyPatch) -> pytest.MonkeyPatch:
    """Start every test from exactly the required variables, never a local .env."""
    for name in (*REQUIRED, "APP_ENV", "LOG_LEVEL"):
        monkeypatch.delenv(name, raising=False)
    for name, value in REQUIRED.items():
        monkeypatch.setenv(name, value)
    return monkeypatch


def load() -> Settings:
    return Settings(_env_file=None)  # type: ignore[call-arg]


def error_fields(exc: ValidationError) -> set[str]:
    return {str(err["loc"][0]) for err in exc.errors()}


def test_loads_a_valid_environment_with_defaults(env: pytest.MonkeyPatch) -> None:
    settings = load()
    assert settings.service_name == "fraud"
    assert settings.port == 8087
    assert settings.app_env == "development"
    assert settings.log_level == "info"


@pytest.mark.parametrize("name", list(REQUIRED))
def test_fails_at_start_when_a_required_variable_is_missing(env: pytest.MonkeyPatch, name: str) -> None:
    env.delenv(name)
    with pytest.raises(ValidationError) as exc:
        load()
    assert name.lower() in error_fields(exc.value)


def test_rejects_a_context_key_shorter_than_32_characters(env: pytest.MonkeyPatch) -> None:
    env.setenv("GATEWAY_CONTEXT_KEY", "x" * 31)
    with pytest.raises(ValidationError) as exc:
        load()
    assert error_fields(exc.value) == {"gateway_context_key"}


def test_accepts_a_context_key_of_exactly_32_characters(env: pytest.MonkeyPatch) -> None:
    env.setenv("GATEWAY_CONTEXT_KEY", "x" * 32)
    assert len(load().gateway_context_key) == 32


@pytest.mark.parametrize("port", ["0", "-1", "eighty"])
def test_rejects_a_bad_port(env: pytest.MonkeyPatch, port: str) -> None:
    env.setenv("PORT", port)
    with pytest.raises(ValidationError) as exc:
        load()
    assert error_fields(exc.value) == {"port"}


@pytest.mark.parametrize(("name", "value"), [("APP_ENV", "staging"), ("LOG_LEVEL", "verbose")])
def test_rejects_values_outside_the_allowed_set(env: pytest.MonkeyPatch, name: str, value: str) -> None:
    env.setenv(name, value)
    with pytest.raises(ValidationError) as exc:
        load()
    assert error_fields(exc.value) == {name.lower()}


def test_lists_every_problem_at_once(env: pytest.MonkeyPatch) -> None:
    for name in REQUIRED:
        env.delenv(name)
    with pytest.raises(ValidationError) as exc:
        load()
    assert error_fields(exc.value) == {n.lower() for n in REQUIRED}


def test_ignores_unrelated_variables(env: pytest.MonkeyPatch) -> None:
    env.setenv("SOMETHING_ELSE", "x")
    assert not hasattr(load(), "something_else")
