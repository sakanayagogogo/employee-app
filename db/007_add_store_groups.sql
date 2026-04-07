-- ============================================================
-- 007_add_store_groups.sql
-- Create store_groups table and associate with stores
-- ============================================================

CREATE TABLE store_groups (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  sort_order    INTEGER      NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Add group_id to stores
ALTER TABLE stores ADD COLUMN group_id INTEGER REFERENCES store_groups(id) ON DELETE SET NULL;

CREATE INDEX idx_stores_group_id ON stores(group_id);
