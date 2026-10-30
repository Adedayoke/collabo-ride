"""Shared baseline from packages/contracts/sql (spec 0010).

Written by packages/contracts/scripts/sql-baseline.mjs. Do not edit.

Revision ID: 0001
Revises:
"""

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

BASELINE = r"""
-- Shared baseline from packages/contracts/sql (spec 0010).
-- Written by packages/contracts/scripts/sql-baseline.mjs. Do not edit: this
-- migration is applied once, and later changes go in a new migration.

-- Keeps updated_at current on every mutable table:
-- CREATE TRIGGER <table>_set_updated_at BEFORE UPDATE ON <table>
--   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

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

-- One row per (event, handler) a consumer has applied, so a redelivered event
-- is applied once per handler. A daily sweep deletes rows older than 30 days.
CREATE TABLE processed_events (
  event_id uuid NOT NULL,
  consumer text NOT NULL,
  stream text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, consumer)
);

-- The one history table per schema: every status change, who made it, and why.
-- Written in the same transaction as the change and its outbox row.
-- Append only (account deletion, feature #32, may only overwrite reason).
CREATE TABLE status_history (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  subject_type text NOT NULL,
  subject_id uuid NOT NULL,
  from_status text,
  to_status text NOT NULL,
  actor_id uuid,
  actor_role text NOT NULL CHECK (actor_role IN ('rider', 'driver', 'staff', 'system')),
  reason text,
  request_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX status_history_subject_idx ON status_history (subject_type, subject_id, created_at);
"""


def upgrade() -> None:
    op.get_bind().exec_driver_sql(BASELINE)


def downgrade() -> None:
    raise NotImplementedError("Migrations are additive only (spec 0010, AC-7)")
