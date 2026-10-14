// Package config loads and validates the service environment at boot.
package config

import (
	"errors"
	"fmt"

	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	AppEnv            string `envconfig:"APP_ENV" default:"development"`
	ServiceName       string `envconfig:"SERVICE_NAME" required:"true"`
	Port              int    `envconfig:"PORT" required:"true"`
	LogLevel          string `envconfig:"LOG_LEVEL" default:"info"`
	GatewayContextKey string `envconfig:"GATEWAY_CONTEXT_KEY" required:"true"`
	DatabaseURL       string `envconfig:"DATABASE_URL" required:"true"`
	ValkeyLiveURL     string `envconfig:"VALKEY_LIVE_URL" required:"true"`
	ValkeyDurableURL  string `envconfig:"VALKEY_DURABLE_URL" required:"true"`
	OSRMURL           string `envconfig:"OSRM_URL" required:"true"`
}

// Load reads a local .env when present (development only), then validates the
// environment. A missing or wrong value fails at start, not mid trip.
func Load() (Config, error) {
	_ = godotenv.Load()
	var c Config
	if err := envconfig.Process("", &c); err != nil {
		return c, fmt.Errorf("read environment: %w", err)
	}
	if len(c.GatewayContextKey) < 32 {
		return c, errors.New("GATEWAY_CONTEXT_KEY must be at least 32 characters")
	}
	switch c.AppEnv {
	case "development", "production", "test":
	default:
		return c, fmt.Errorf("APP_ENV must be development, production, or test, got %q", c.AppEnv)
	}
	return c, nil
}
