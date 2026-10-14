package config

import (
	"os"
	"strings"
	"testing"
)

var required = map[string]string{
	"SERVICE_NAME":        "dispatch",
	"PORT":                "8083",
	"GATEWAY_CONTEXT_KEY": "test-gateway-context-key-0123456789abcdef",
	"DATABASE_URL":        "postgres://dispatch:pw@localhost:5432/collabo",
	"VALKEY_LIVE_URL":     "redis://localhost:6379",
	"VALKEY_DURABLE_URL":  "redis://localhost:6380",
	"OSRM_URL":            "http://localhost:5000",
}

// unset removes a variable for this test only; t.Setenv restores it afterwards.
func unset(t *testing.T, name string) {
	t.Helper()
	t.Setenv(name, "")
	os.Unsetenv(name)
}

// setEnv sets every required variable, then applies overrides. An empty
// override value unsets the variable for this test.
func setEnv(t *testing.T, overrides map[string]string) {
	t.Helper()
	unset(t, "APP_ENV")
	unset(t, "LOG_LEVEL")
	for k, v := range required {
		t.Setenv(k, v)
	}
	for k, v := range overrides {
		if v == "" {
			unset(t, k)
		} else {
			t.Setenv(k, v)
		}
	}
}

func TestLoad_ValidEnvironment(t *testing.T) {
	setEnv(t, nil)

	c, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if c.ServiceName != "dispatch" || c.Port != 8083 || c.OSRMURL != "http://localhost:5000" {
		t.Errorf("unexpected config: %+v", c)
	}
}

func TestLoad_Defaults(t *testing.T) {
	setEnv(t, nil)

	c, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if c.AppEnv != "development" {
		t.Errorf("AppEnv: got %q want development", c.AppEnv)
	}
	if c.LogLevel != "info" {
		t.Errorf("LogLevel: got %q want info", c.LogLevel)
	}
}

func TestLoad_MissingRequiredVariable(t *testing.T) {
	for name := range required {
		t.Run(name, func(t *testing.T) {
			setEnv(t, map[string]string{name: ""})

			_, err := Load()
			if err == nil {
				t.Fatalf("expected an error when %s is missing", name)
			}
			if !strings.Contains(err.Error(), name) {
				t.Errorf("error should name %s, got: %v", name, err)
			}
		})
	}
}

func TestLoad_ShortContextKey(t *testing.T) {
	setEnv(t, map[string]string{"GATEWAY_CONTEXT_KEY": strings.Repeat("x", 31)})

	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "GATEWAY_CONTEXT_KEY") {
		t.Fatalf("expected a GATEWAY_CONTEXT_KEY error, got %v", err)
	}
}

func TestLoad_ContextKeyOfExactly32Characters(t *testing.T) {
	setEnv(t, map[string]string{"GATEWAY_CONTEXT_KEY": strings.Repeat("x", 32)})

	if _, err := Load(); err != nil {
		t.Fatalf("a 32 character key should pass: %v", err)
	}
}

func TestLoad_UnknownAppEnv(t *testing.T) {
	setEnv(t, map[string]string{"APP_ENV": "staging"})

	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "APP_ENV") {
		t.Fatalf("expected an APP_ENV error, got %v", err)
	}
}

func TestLoad_AcceptsEachKnownAppEnv(t *testing.T) {
	for _, env := range []string{"development", "production", "test"} {
		t.Run(env, func(t *testing.T) {
			setEnv(t, map[string]string{"APP_ENV": env})

			c, err := Load()
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if c.AppEnv != env {
				t.Errorf("got %q want %q", c.AppEnv, env)
			}
		})
	}
}

func TestLoad_NonNumericPort(t *testing.T) {
	setEnv(t, map[string]string{"PORT": "eighty"})

	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "PORT") {
		t.Fatalf("expected a PORT error, got %v", err)
	}
}
