CREATE TABLE announcement_likes (
  id              SERIAL      PRIMARY KEY,
  announcement_id INTEGER     NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id         INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (announcement_id, user_id)
);

CREATE INDEX idx_announcement_likes_announcement_id ON announcement_likes(announcement_id);
CREATE INDEX idx_announcement_likes_user_id ON announcement_likes(user_id);

CREATE TABLE announcement_comments (
  id              SERIAL      PRIMARY KEY,
  announcement_id INTEGER     NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id         INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcement_comments_announcement_id ON announcement_comments(announcement_id);
