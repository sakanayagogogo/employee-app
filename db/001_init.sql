-- ============================================================
-- 001_init.sql  Employee Engagement App - Initial Schema
-- ============================================================

-- Enums
CREATE TYPE user_role AS ENUM ('GENERAL', 'STORE_ADMIN', 'HQ_ADMIN');
CREATE TYPE employment_type AS ENUM ('EMPLOYEE', 'PA');
CREATE TYPE importance_level AS ENUM ('NORMAL', 'IMPORTANT');
CREATE TYPE target_type AS ENUM ('ALL', 'STORE', 'EMPLOYMENT_TYPE', 'USER');
CREATE TYPE inquiry_destination AS ENUM ('STORE', 'HEADQUARTERS');
CREATE TYPE inquiry_category AS ENUM ('労務', '業務', '教育', '人間関係', '設備', 'その他');
CREATE TYPE inquiry_status AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');
CREATE TYPE widget_type AS ENUM ('SURVEY', 'ATTENDANCE', 'CHECKLIST', 'LINK', 'BOARD');
CREATE TYPE widget_size AS ENUM ('S', 'M', 'L');

-- ============================================================
-- stores
-- ============================================================
CREATE TABLE stores (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  code          VARCHAR(20)  NOT NULL UNIQUE,
  address       TEXT,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stores_code ON stores(code);

-- ============================================================
-- users
-- ============================================================
CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  employee_number VARCHAR(20)     NOT NULL UNIQUE,
  name            VARCHAR(100)    NOT NULL,
  email           VARCHAR(255),
  role            user_role       NOT NULL DEFAULT 'GENERAL',
  store_id        INTEGER         REFERENCES stores(id) ON DELETE SET NULL,
  employment_type employment_type NOT NULL DEFAULT 'EMPLOYEE',
  password_hash   TEXT            NOT NULL,
  is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
  must_change_pw  BOOLEAN         NOT NULL DEFAULT FALSE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_employee_number ON users(employee_number);
CREATE INDEX idx_users_store_id ON users(store_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- announcements
-- ============================================================
CREATE TABLE announcements (
  id           SERIAL          PRIMARY KEY,
  title        VARCHAR(200)    NOT NULL,
  body         TEXT            NOT NULL,
  importance   importance_level NOT NULL DEFAULT 'NORMAL',
  start_at     TIMESTAMPTZ,
  end_at       TIMESTAMPTZ,
  is_published BOOLEAN         NOT NULL DEFAULT FALSE,
  author_id    INTEGER         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_is_published ON announcements(is_published);
CREATE INDEX idx_announcements_start_at ON announcements(start_at);
CREATE INDEX idx_announcements_end_at ON announcements(end_at);
CREATE INDEX idx_announcements_author_id ON announcements(author_id);

-- ============================================================
-- announcement_targets
-- ============================================================
CREATE TABLE announcement_targets (
  id              SERIAL      PRIMARY KEY,
  announcement_id INTEGER     NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  target_type     target_type NOT NULL,
  target_value    VARCHAR(100)   -- NULL for ALL; store_id / employment_type / user_id for others
);

CREATE INDEX idx_ann_targets_announcement_id ON announcement_targets(announcement_id);
CREATE INDEX idx_ann_targets_type_value ON announcement_targets(target_type, target_value);

-- ============================================================
-- announcement_reads
-- ============================================================
CREATE TABLE announcement_reads (
  id              SERIAL      PRIMARY KEY,
  announcement_id INTEGER     NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id         INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (announcement_id, user_id)
);

CREATE INDEX idx_ann_reads_announcement_id ON announcement_reads(announcement_id);
CREATE INDEX idx_ann_reads_user_id ON announcement_reads(user_id);

-- ============================================================
-- inquiries
-- ============================================================
CREATE TABLE inquiries (
  id            SERIAL              PRIMARY KEY,
  title         VARCHAR(200)        NOT NULL,
  destination   inquiry_destination NOT NULL,
  category      inquiry_category    NOT NULL,
  status        inquiry_status      NOT NULL DEFAULT 'OPEN',
  author_id     INTEGER             NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  store_id      INTEGER             REFERENCES stores(id) ON DELETE SET NULL,
  assignee_id   INTEGER             REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inquiries_author_id ON inquiries(author_id);
CREATE INDEX idx_inquiries_store_id ON inquiries(store_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_destination ON inquiries(destination);

-- ============================================================
-- inquiry_messages
-- ============================================================
CREATE TABLE inquiry_messages (
  id          SERIAL      PRIMARY KEY,
  inquiry_id  INTEGER     NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  author_id   INTEGER     NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  body        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inq_messages_inquiry_id ON inquiry_messages(inquiry_id);

-- ============================================================
-- store_portals
-- ============================================================
CREATE TABLE store_portals (
  id          SERIAL      PRIMARY KEY,
  store_id    INTEGER     NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- portal_widgets
-- ============================================================
CREATE TABLE portal_widgets (
  id           SERIAL      PRIMARY KEY,
  store_id     INTEGER     NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  type         widget_type NOT NULL,
  title        VARCHAR(200) NOT NULL,
  config_json  JSONB       NOT NULL DEFAULT '{}',
  size         widget_size NOT NULL DEFAULT 'M',
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  is_published BOOLEAN     NOT NULL DEFAULT FALSE,
  expires_at   TIMESTAMPTZ,
  created_by   INTEGER     REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portal_widgets_store_id ON portal_widgets(store_id);
CREATE INDEX idx_portal_widgets_is_published ON portal_widgets(is_published);
CREATE INDEX idx_portal_widgets_sort_order ON portal_widgets(sort_order);

-- ============================================================
-- portal_layouts
-- ============================================================
CREATE TABLE portal_layouts (
  id          SERIAL      PRIMARY KEY,
  store_id    INTEGER     NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
  layout_json JSONB       NOT NULL DEFAULT '[]',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- widget_responses
-- ============================================================
CREATE TABLE widget_responses (
  id            SERIAL      PRIMARY KEY,
  widget_id     INTEGER     NOT NULL REFERENCES portal_widgets(id) ON DELETE CASCADE,
  user_id       INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  response_json JSONB       NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_widget_responses_widget_id ON widget_responses(widget_id);
CREATE INDEX idx_widget_responses_user_id ON widget_responses(user_id);
-- Allow multiple responses for BOARD, unique for others enforced at app level
-- CREATE UNIQUE INDEX idx_widget_responses_unique
--   ON widget_responses(widget_id, user_id)
--   WHERE (SELECT type FROM portal_widgets WHERE id = widget_responses.widget_id) != 'BOARD';

-- ============================================================
-- audit_logs
-- ============================================================
CREATE TABLE audit_logs (
  id            SERIAL      PRIMARY KEY,
  actor_user_id INTEGER     REFERENCES users(id) ON DELETE SET NULL,
  action        VARCHAR(100) NOT NULL,
  entity_type   VARCHAR(100),
  entity_id     INTEGER,
  detail_json   JSONB,
  ip_address    INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
