-- One row per (event, handler) a consumer has applied, so a redelivered event
-- is applied once per handler. A daily sweep deletes rows older than 30 days.
CREATE TABLE processed_events (
  event_id uuid NOT NULL,
  consumer text NOT NULL,
  stream text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, consumer)
);
