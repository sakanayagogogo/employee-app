-- ============================================================
-- 008_add_inquiry_recipient.sql
-- Allow admins to specify a recipient user for an inquiry
-- ============================================================

ALTER TABLE inquiries ADD COLUMN recipient_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_inquiries_recipient_id ON inquiries(recipient_id);
