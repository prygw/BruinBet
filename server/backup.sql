PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE users (
    id              INTEGER     PRIMARY KEY AUTOINCREMENT,
    email           TEXT        NOT NULL UNIQUE COLLATE NOCASE,
    password_hash   INTEGER     NOT NULL,
    username        TEXT        NOT NULL,
    balance         INTEGER     NOT NULL DEFAULT 10000,
    is_admin        INTEGER     NOT NULL DEFAULT 0,
    created_at      INTEGER     NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO users VALUES(5,'john@ucla.edu','$2b$10$HZlnVxRgmT/BsT1.IKEx/.cobQmMB6zQ5.b5NXPAEDDxCE4KmFNMm','John Smith',1000,0,'2026-05-08 18:20:41');
INSERT INTO users VALUES(6,'j@ucla.edu','$2b$10$U7S7kVJN0OmEMzad.8vqB.xvh8CraD1ye4KSjkIVdQQfSOebMa6iy','JJ',1000,0,'2026-05-08 22:02:59');
CREATE TABLE markets (
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
    FOREIGN KEY (winning_id) REFERENCES market_options(id)
);
CREATE TABLE market_options (
  id        INTEGER     PRIMARY KEY AUTOINCREMENT,
  market_id INTEGER     NOT NULL,
  label     TEXT        NOT NULL,
  FOREIGN KEY (market_id)   REFERENCES markets(id) ON DELETE CASCADE
);
CREATE TABLE bets (
  id            INTEGER     PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER     NOT NULL,
  market_id     INTEGER     NOT NULL,
  option_id     INTEGER     NOT NULL,
  amount        INTEGER     NOT NULL CHECK (amount > 0),
  created_at    TEXT        NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id)     REFERENCES users(id),
  FOREIGN KEY (market_id)   REFERENCES markets(id),
  FOREIGN KEY (option_id)   REFERENCES market_options(id)
);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('users',6);
CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_market_options_market ON market_options(market_id);
CREATE INDEX idx_bets_user ON bets(user_id);
CREATE INDEX idx_bets_market  ON bets(market_id);
COMMIT;
