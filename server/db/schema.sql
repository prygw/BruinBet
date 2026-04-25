CREATE TABLE IF NOT EXISTS users (
    id              INTEGER     PRIMARY KEY AUTOINCREMENT,
    email           TEXT        NOT NULL UNIQUE COLLATE NOCASE,
    password_hash   INTEGER     NOT NULL,
    username        TEXT        NOT NULL,
    balance         INTEGER     NOT NULL DEFAULT 10000,
    is_admin        INTEGER     NOT NULL DEFAULT 0,
    created_at      INTEGER     NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS markets (
    id              INTEGER     PRIMARY KEY,
    market_name     TEXT        NOT NULL,
    description     TEXT        NOT NULL,
    category        TEXT,
    status          TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at      INTEGER     NOT NULL DEFAULT (datetime('now')),
    closes_at       INTEGER     NOT NULL,
    winning_id      INTEGER,
    created_by      INTEGER     NOT NULL,
    FOREIGN KEY (created_by)        REFERENCES users(id),
    FOREIGN KEY (winning_option_id) REFERENCES bet_options(id)
);

CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);

CREATE TABLE IF NOT EXISTS market_options (
  id        INTEGER     PRIMARY KEY AUTOINCREMENT,
  market_id INTEGER     NOT NULL,
  label     TEXT        NOT NULL,
  FOREIGN KEY (market_id)   REFERENCES markets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_market_options_market ON market_options(market_id);

CREATE TABLE IF NOT EXISTS placements (
  id            INTEGER     PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER     NOT NULL,
  market_id     INTEGER     NOT NULL,
  option_id     INTEGER     NOT NULL,
  amount        INTEGER     NOT NULL CHECK (amount > 0),
  created_at    TEXT        NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id)     REFERENCES users(id),
  FOREIGN KEY (market_id)   REFERENCES markets(id),
  FOREIGN KEY (option_id)   REFERENCES bet_options(id)
);

CREATE INDEX IF NOT EXISTS idx_placements_user ON placements(user_id);
CREATE INDEX IF NOT EXISTS idx_placements_market  ON placements(market_id);