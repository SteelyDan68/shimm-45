-- Clean up orphaned data in clients table
-- This table is no longer used after the unified client system migration
DROP TABLE IF EXISTS clients CASCADE;