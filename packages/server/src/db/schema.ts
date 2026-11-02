/**
 * Database schema, as numbered migrations. `PRAGMA user_version` holds the number of the last migration applied.
 * To change the schema: add a NEW entry at the end. Never edit an entry that has already shipped.
 */
export const MIGRATIONS: string[] = [
  // 1: first version
  `
  CREATE TABLE questions (
    id             TEXT PRIMARY KEY,
    category       TEXT NOT NULL,
    prompt         TEXT NOT NULL,
    rules          TEXT NOT NULL,
    status         TEXT NOT NULL CHECK (status IN ('draft','approved','rejected')),
    source         TEXT NOT NULL,                 -- 'seed' | 'llm' | 'import'
    model          TEXT,
    policy_version TEXT NOT NULL,
    notes          TEXT,                          -- remarks for the human reviewer
    created_at     INTEGER NOT NULL,
    decided_at     INTEGER
  );

  -- the canonical answers of a question. The tier belongs to the canonical answer, so every spelling of it scores the same.
  CREATE TABLE answers (
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    norm        TEXT NOT NULL,                    -- normalised name (see normalize.ts)
    name        TEXT NOT NULL,                    -- as shown to the player
    tier        INTEGER NOT NULL CHECK (tier BETWEEN 0 AND 5),
    description TEXT,
    source      TEXT NOT NULL,                    -- 'seed' | 'draft' | 'live' | 'admin'
    model       TEXT,
    review      INTEGER NOT NULL DEFAULT 0,       -- 1 = a person should look at this one
    note        TEXT,
    times_given INTEGER NOT NULL DEFAULT 0,       -- how often players gave it (a first measure of familiarity)
    created_at  INTEGER NOT NULL,
    PRIMARY KEY (question_id, norm)
  );

  -- what players type -> the canonical answer it means, or a stored "does not count"
  CREATE TABLE spellings (
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    norm        TEXT NOT NULL,
    verdict     TEXT NOT NULL CHECK (verdict IN ('valid','invalid')),
    canon_norm  TEXT,                             -- for 'valid'
    message     TEXT,                             -- for 'invalid': what the player is told
    source      TEXT NOT NULL,                    -- 'alias' | 'typo' | 'llm' | 'seed' | 'admin'
    model       TEXT,
    created_at  INTEGER NOT NULL,
    hits        INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (question_id, norm),
    FOREIGN KEY (question_id, canon_norm) REFERENCES answers(question_id, norm) ON DELETE CASCADE
  );

  CREATE TABLE runs (
    id             TEXT PRIMARY KEY,
    created_at     INTEGER NOT NULL,
    checker        TEXT NOT NULL,
    policy_version TEXT NOT NULL
  );

  CREATE TABLE run_questions (
    run_id      TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    idx         INTEGER NOT NULL,
    question_id TEXT NOT NULL REFERENCES questions(id),
    started_at  INTEGER,                          -- when the browser said the question was on screen
    busy_ms     INTEGER NOT NULL DEFAULT 0,       -- time the server spent checking answers (not the player's time)
    result      TEXT CHECK (result IN ('valid','miss')),
    answer      TEXT,
    tier        INTEGER,
    points      INTEGER,
    finished_at INTEGER,
    PRIMARY KEY (run_id, idx)
  );

  -- every answer typed, for disputes and for looking at how players answer
  CREATE TABLE attempts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id     TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    idx        INTEGER NOT NULL,
    text       TEXT NOT NULL,
    status     TEXT NOT NULL,                     -- valid | invalid | unresolved
    answer     TEXT,
    tier       INTEGER,
    message    TEXT,
    via        TEXT NOT NULL,                     -- stored | typo | llm | none
    ms         INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX attempts_run ON attempts(run_id, idx);

  -- every call to the language model (budget and debugging)
  CREATE TABLE llm_log (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    at      INTEGER NOT NULL,
    purpose TEXT NOT NULL,                        -- judge | generate | audit
    model   TEXT NOT NULL,
    ok      INTEGER NOT NULL,
    ms      INTEGER NOT NULL,
    error   TEXT
  );
  CREATE INDEX llm_log_at ON llm_log(at);

  -- manual corrections (who changed what, and why). Past runs keep the points they earned.
  CREATE TABLE changes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    at          INTEGER NOT NULL,
    question_id TEXT NOT NULL,
    norm        TEXT,
    what        TEXT NOT NULL,
    before      TEXT,
    after       TEXT,
    reason      TEXT
  );
  `,
  // 2: the Daily Challenge (Phase 3)
  `
  ALTER TABLE runs ADD COLUMN mode TEXT NOT NULL DEFAULT 'solo' CHECK (mode IN ('solo','daily'));

  -- small settings the server keeps for itself (the day the daily started, ...)
  CREATE TABLE meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- the seven questions everybody gets on a UTC day, chosen once and then never changed after the first player starts
  CREATE TABLE daily_sets (
    day        TEXT PRIMARY KEY,                  -- 'YYYY-MM-DD' (UTC)
    created_at INTEGER NOT NULL
  );
  CREATE TABLE daily_set_questions (
    day         TEXT NOT NULL REFERENCES daily_sets(day) ON DELETE CASCADE,
    idx         INTEGER NOT NULL,
    question_id TEXT NOT NULL REFERENCES questions(id),
    PRIMARY KEY (day, idx)
  );
  CREATE INDEX daily_set_questions_q ON daily_set_questions(question_id, day);

  -- one row per browser (guest) per day: the single attempt
  CREATE TABLE daily_plays (
    day         TEXT NOT NULL REFERENCES daily_sets(day),
    guest_id    TEXT NOT NULL,                    -- random id the browser made up; no account, no name
    run_id      TEXT NOT NULL UNIQUE REFERENCES runs(id),
    ip_hash     TEXT,                             -- sha256(day + address): lets us cap runs per network without keeping addresses
    started_at  INTEGER NOT NULL,
    finished_at INTEGER,                          -- null while the run is open
    total       INTEGER,                          -- points, set when finished
    PRIMARY KEY (day, guest_id)
  );
  CREATE INDEX daily_plays_total ON daily_plays(day, total) WHERE finished_at IS NOT NULL;
  CREATE INDEX daily_plays_ip ON daily_plays(day, ip_hash);
  CREATE INDEX daily_plays_guest ON daily_plays(guest_id, day);
  `,
]
