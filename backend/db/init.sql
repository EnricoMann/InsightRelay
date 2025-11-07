-- Create table of data sources
CREATE TABLE IF NOT EXISTS sources (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,           -- e.g. 'hn', 'github', 'reddit'
  name TEXT NOT NULL
);

-- Seed: insert Hacker News as default source
INSERT INTO sources (key, name)
VALUES ('hn', 'Hacker News')
ON CONFLICT (key) DO NOTHING;

-- Table for raw collected items
CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  source_key TEXT NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT,
  url TEXT,
  author TEXT,
  points INTEGER,
  comments INTEGER,
  posted_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source_key, external_id)
);

-- Index to quickly query recent items by source
CREATE INDEX IF NOT EXISTS idx_items_source_posted
  ON items (source_key, posted_at DESC);

-- Table for computed trend metrics
CREATE TABLE IF NOT EXISTS trend_metrics (
  id BIGSERIAL PRIMARY KEY,
  item_id BIGINT REFERENCES items(id) ON DELETE CASCADE,
  time_window TEXT NOT NULL,                 -- e.g. '1h','24h','7d'
  trending_score DOUBLE PRECISION NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index to fetch top trends efficiently
CREATE INDEX IF NOT EXISTS idx_trend_time_window_score
  ON trend_metrics (time_window, trending_score DESC, computed_at DESC);
