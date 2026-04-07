-- ============================================================
-- seed.sql  Initial seed data
-- HQ_ADMIN user: employee_number=000001 password=Admin1234!
-- Password hash generated with bcrypt(cost=12): Admin1234!
-- ============================================================

-- Insert HQ store
INSERT INTO stores (name, code, address, is_active)
VALUES ('本部', 'HQ', '東京都渋谷区...', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Insert sample store
INSERT INTO stores (name, code, address, is_active)
VALUES ('渋谷店', 'SHIBUYA', '東京都渋谷区...', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO stores (name, code, address, is_active)
VALUES ('新宿店', 'SHINJUKU', '東京都新宿区...', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Insert HQ_ADMIN user
-- Password: Admin1234!  (bcrypt hash below, regenerate if needed)
INSERT INTO users (employee_number, name, email, role, store_id, employment_type, password_hash, is_active)
VALUES (
  '000001',
  '管理者 太郎',
  'admin@example.com',
  'HQ_ADMIN',
  (SELECT id FROM stores WHERE code = 'HQ'),
  'EMPLOYEE',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4P7p/5J0oW',
  TRUE
)
ON CONFLICT (employee_number) DO NOTHING;

-- Insert STORE_ADMIN for Shibuya
INSERT INTO users (employee_number, name, email, role, store_id, employment_type, password_hash, is_active)
VALUES (
  '000101',
  '渋谷 店長',
  'shibuya@example.com',
  'STORE_ADMIN',
  (SELECT id FROM stores WHERE code = 'SHIBUYA'),
  'EMPLOYEE',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4P7p/5J0oW',
  TRUE
)
ON CONFLICT (employee_number) DO NOTHING;

-- Insert sample GENERAL user
INSERT INTO users (employee_number, name, email, role, store_id, employment_type, password_hash, is_active)
VALUES (
  '001001',
  '山田 花子',
  'yamada@example.com',
  'GENERAL',
  (SELECT id FROM stores WHERE code = 'SHIBUYA'),
  'EMPLOYEE',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4P7p/5J0oW',
  TRUE
)
ON CONFLICT (employee_number) DO NOTHING;

-- Create store_portals for initial stores
INSERT INTO store_portals (store_id)
SELECT id FROM stores
ON CONFLICT (store_id) DO NOTHING;

-- Create portal_layouts for initial stores
INSERT INTO portal_layouts (store_id, layout_json)
SELECT id, '[]'::jsonb FROM stores
ON CONFLICT (store_id) DO NOTHING;
