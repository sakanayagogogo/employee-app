-- Add category to announcements

CREATE TYPE announcement_category AS ENUM ('GENERAL', 'PRESIDENT', 'MUST_READ');

ALTER TABLE announcements 
ADD COLUMN category announcement_category NOT NULL DEFAULT 'GENERAL';

CREATE INDEX idx_announcements_category ON announcements(category);
