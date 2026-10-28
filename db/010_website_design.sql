-- デザインの下書きと公開版を別々に保存します。
CREATE TABLE IF NOT EXISTS website_design (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  published jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE website_design ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE website_design FROM PUBLIC, anon, authenticated;
