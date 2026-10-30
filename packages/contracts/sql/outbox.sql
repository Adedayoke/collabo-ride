-- Transactional outbox (spec 0009, widened by spec 0010). A state change and
-- its event row commit in one transaction; the relay (feature #4) publishes
-- unsent rows to Valkey Streams and sets sent_at.
CREATE TABLE outbox (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  stream text NOT NULL,
  type text NOT NULL,
  payload jsonb NOT NULL,
  subject_type text NOT NULL,
  subject_seq bigint NOT NULL,
  request_id text NOT NULL,
  traceparent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX outbox_unsent_idx ON outbox (created_at) WHERE sent_at IS NULL;
