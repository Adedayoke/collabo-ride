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
