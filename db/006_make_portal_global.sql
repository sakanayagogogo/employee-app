-- ============================================================
-- 006_make_portal_global.sql
-- Drop store dependency from portal_widgets to make menus global
-- ============================================================

-- 1. Drop store-specific layout and portal configuration
DROP TABLE IF EXISTS portal_layouts;
DROP TABLE IF EXISTS store_portals;

-- 2. Drop the store_id column and its constraints/indexes
ALTER TABLE portal_widgets DROP COLUMN IF EXISTS store_id CASCADE;

-- (The index idx_portal_widgets_store_id is automatically dropped with the column cascade)
