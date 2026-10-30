-- Ledger core (spec 0010.3, The ledger). Runs as payments_owner, which owns
-- these tables and their triggers. The payments role may only SELECT and
-- INSERT on the journal, and writes it through post_journal_entry().

CREATE TABLE ledger_accounts (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  owner_type text NOT NULL CHECK (owner_type IN ('user', 'system')),
  owner_id uuid,
  kind text NOT NULL CHECK (kind IN (
    'rider_wallet', 'driver',
    'platform_revenue', 'promo_expense', 'referral_expense', 'provider_clearing', 'payout_clearing'
  )),
  floor_kobo bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ledger_accounts_owner_check CHECK ((owner_type = 'user') = (owner_id IS NOT NULL)),
  CONSTRAINT ledger_accounts_kind_owner_check CHECK ((owner_type = 'user') = (kind IN ('rider_wallet', 'driver'))),
  CONSTRAINT ledger_accounts_wallet_floor_check CHECK (kind <> 'rider_wallet' OR floor_kobo = 0)
);

COMMENT ON COLUMN ledger_accounts.owner_id IS 'ref accounts.users';

CREATE UNIQUE INDEX ledger_accounts_one_per_user_kind ON ledger_accounts (owner_id, kind) WHERE owner_type = 'user';
CREATE UNIQUE INDEX ledger_accounts_one_per_system_kind ON ledger_accounts (kind) WHERE owner_type = 'system';

CREATE TRIGGER ledger_accounts_set_updated_at BEFORE UPDATE ON ledger_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE journal_entries (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  kind text NOT NULL CHECK (kind IN (
    'rider_payment', 'cash_commission', 'topup', 'refund',
    'payout_request', 'payout_paid', 'payout_failed', 'referral_reward', 'adjustment'
  )),
  idempotency_key text NOT NULL CONSTRAINT journal_entries_idempotency_key_key UNIQUE,
  request_hash text NOT NULL,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  memo text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN journal_entries.created_by IS 'ref accounts.users';

CREATE TABLE journal_lines (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  entry_id uuid NOT NULL REFERENCES journal_entries (id) ON DELETE RESTRICT,
  account_id uuid NOT NULL REFERENCES ledger_accounts (id) ON DELETE RESTRICT,
  amount_kobo bigint NOT NULL CHECK (amount_kobo <> 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX journal_lines_entry_idx ON journal_lines (entry_id);
CREATE INDEX journal_lines_account_idx ON journal_lines (account_id, created_at);

-- Every entry has at least two lines and sums to zero, checked at commit.
-- The trigger on journal_entries catches an entry inserted with no lines.
CREATE FUNCTION journal_entry_balanced() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_entry uuid;
  v_lines integer;
  v_sum numeric;
BEGIN
  IF TG_TABLE_NAME = 'journal_lines' THEN
    v_entry := NEW.entry_id;
  ELSE
    v_entry := NEW.id;
  END IF;
  SELECT count(*), coalesce(sum(amount_kobo), 0) INTO v_lines, v_sum
  FROM journal_lines WHERE entry_id = v_entry;
  IF v_lines < 2 THEN
    RAISE EXCEPTION 'journal_entry_too_few_lines'
      USING ERRCODE = 'check_violation', DETAIL = format('entry %s has %s line(s)', v_entry, v_lines);
  END IF;
  IF v_sum <> 0 THEN
    RAISE EXCEPTION 'journal_entry_unbalanced'
      USING ERRCODE = 'check_violation', DETAIL = format('entry %s sums to %s', v_entry, v_sum);
  END IF;
  RETURN NULL;
END
$$;

CREATE CONSTRAINT TRIGGER journal_lines_balanced AFTER INSERT ON journal_lines
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION journal_entry_balanced();
CREATE CONSTRAINT TRIGGER journal_entries_balanced AFTER INSERT ON journal_entries
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION journal_entry_balanced();

-- Ledger rows are never edited or removed; a mistake gets an adjustment entry.
CREATE FUNCTION journal_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'journal_immutable'
    USING ERRCODE = 'insufficient_privilege', DETAIL = format('%s on %s is not allowed', TG_OP, TG_TABLE_NAME);
END
$$;

CREATE TRIGGER journal_entries_immutable BEFORE UPDATE OR DELETE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION journal_immutable();
CREATE TRIGGER journal_entries_no_truncate BEFORE TRUNCATE ON journal_entries
  FOR EACH STATEMENT EXECUTE FUNCTION journal_immutable();
CREATE TRIGGER journal_lines_immutable BEFORE UPDATE OR DELETE ON journal_lines
  FOR EACH ROW EXECUTE FUNCTION journal_immutable();
CREATE TRIGGER journal_lines_no_truncate BEFORE TRUNCATE ON journal_lines
  FOR EACH STATEMENT EXECUTE FUNCTION journal_immutable();

-- A user's account is created on first use.
CREATE FUNCTION ensure_ledger_account(p_owner_id uuid, p_kind text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = payments, pg_temp AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_kind NOT IN ('rider_wallet', 'driver') THEN
    RAISE EXCEPTION 'invalid_account_kind' USING DETAIL = format('%s is not a user account kind', p_kind);
  END IF;
  INSERT INTO ledger_accounts (owner_type, owner_id, kind, floor_kobo)
  VALUES ('user', p_owner_id, p_kind, CASE WHEN p_kind = 'rider_wallet' THEN 0 END)
  ON CONFLICT (owner_id, kind) WHERE owner_type = 'user' DO NOTHING
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM ledger_accounts
    WHERE owner_type = 'user' AND owner_id = p_owner_id AND kind = p_kind;
  END IF;
  RETURN v_id;
END
$$;

-- The only way to write the ledger (spec 0010.3, steps 1 to 4).
-- p_lines is a JSON array of {"account_id": uuid, "amount_kobo": integer}.
CREATE FUNCTION post_journal_entry(
  p_key text,
  p_kind text,
  p_source_type text,
  p_source_id uuid,
  p_memo text,
  p_lines jsonb,
  p_must_stay_non_negative uuid[] DEFAULT '{}',
  p_created_by uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = payments, pg_temp AS $$
DECLARE
  v_hash text;
  v_entry uuid;
  v_existing_hash text;
  v_touched uuid[];
  v_short uuid;
BEGIN
  IF jsonb_typeof(p_lines) <> 'array' THEN
    RAISE EXCEPTION 'invalid_lines' USING DETAIL = 'p_lines must be a JSON array';
  END IF;

  SELECT encode(sha256(convert_to(
    p_kind || '|' || p_source_type || '|' || p_source_id || '|' ||
    coalesce(string_agg((l ->> 'account_id') || ':' || (l ->> 'amount_kobo'), ','
      ORDER BY l ->> 'account_id', (l ->> 'amount_kobo')::bigint), ''),
    'UTF8')), 'hex')
  INTO v_hash
  FROM jsonb_array_elements(p_lines) AS l;

  -- 1. Claim the key. A replay with the same content returns the first entry.
  INSERT INTO journal_entries (kind, idempotency_key, request_hash, source_type, source_id, memo, created_by)
  VALUES (p_kind, p_key, v_hash, p_source_type, p_source_id, p_memo, p_created_by)
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_entry;

  IF v_entry IS NULL THEN
    SELECT id, request_hash INTO v_entry, v_existing_hash FROM journal_entries WHERE idempotency_key = p_key;
    IF v_existing_hash <> v_hash THEN
      RAISE EXCEPTION 'idempotency_key_reused' USING DETAIL = format('key %s was used for different lines', p_key);
    END IF;
    RETURN v_entry;
  END IF;

  -- 2. Lock the touched user accounts in id order. System accounts are never locked.
  SELECT array_agg(DISTINCT id) INTO v_touched FROM (
    SELECT (l ->> 'account_id')::uuid AS id FROM jsonb_array_elements(p_lines) AS l
    UNION
    SELECT unnest(p_must_stay_non_negative)
  ) AS t;
  PERFORM 1 FROM ledger_accounts
  WHERE id = ANY (v_touched) AND owner_type = 'user'
  ORDER BY id
  FOR UPDATE;

  -- 3. The lines.
  INSERT INTO journal_lines (entry_id, account_id, amount_kobo)
  SELECT v_entry, (l ->> 'account_id')::uuid, (l ->> 'amount_kobo')::bigint
  FROM jsonb_array_elements(p_lines) AS l;

  -- 4. Floors: an account's own floor, or zero when the caller asks for it.
  SELECT a.id INTO v_short
  FROM ledger_accounts AS a
  CROSS JOIN LATERAL (
    SELECT CASE
      WHEN a.id = ANY (p_must_stay_non_negative) THEN greatest(coalesce(a.floor_kobo, 0), 0)
      ELSE a.floor_kobo
    END AS floor_kobo
  ) AS f
  WHERE a.id = ANY (v_touched)
    AND f.floor_kobo IS NOT NULL
    AND (SELECT coalesce(sum(amount_kobo), 0) FROM journal_lines WHERE account_id = a.id) < f.floor_kobo
  LIMIT 1;
  IF v_short IS NOT NULL THEN
    RAISE EXCEPTION 'insufficient_balance' USING DETAIL = format('account %s would go below its floor', v_short);
  END IF;

  RETURN v_entry;
END
$$;

-- The service role: read and append, never edit (spec 0010.3, Ownership).
REVOKE UPDATE, DELETE, TRUNCATE ON ledger_accounts, journal_entries, journal_lines FROM payments;
REVOKE INSERT ON ledger_accounts FROM payments;
REVOKE ALL ON FUNCTION ensure_ledger_account(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION post_journal_entry(text, text, text, uuid, text, jsonb, uuid[], uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ensure_ledger_account(uuid, text) TO payments;
GRANT EXECUTE ON FUNCTION post_journal_entry(text, text, text, uuid, text, jsonb, uuid[], uuid) TO payments;

-- System accounts, seeded once.
INSERT INTO ledger_accounts (owner_type, kind) VALUES
  ('system', 'platform_revenue'),
  ('system', 'promo_expense'),
  ('system', 'referral_expense'),
  ('system', 'provider_clearing'),
  ('system', 'payout_clearing');
