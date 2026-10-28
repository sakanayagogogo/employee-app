-- 公開専用の記事。既存の組合員向けデータとは分離する。
CREATE TABLE IF NOT EXISTS website_articles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  category VARCHAR(40) NOT NULL DEFAULT '組合ニュース',
  body TEXT NOT NULL,
  image_url TEXT,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS website_articles_public_idx ON website_articles (published_at DESC, id DESC) WHERE published = TRUE;
-- アプリのサーバー接続だけが読み書きします。匿名APIから下書きを読ませません。
ALTER TABLE website_articles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE website_articles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE website_articles_id_seq FROM PUBLIC, anon, authenticated;
