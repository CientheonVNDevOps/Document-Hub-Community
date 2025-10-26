-- Migration: Add trash functionality to folders table
-- Run this in your Supabase SQL editor

-- Add trash columns to folders table
ALTER TABLE folders ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_folders_is_deleted ON folders(is_deleted);
CREATE INDEX IF NOT EXISTS idx_folders_deleted_at ON folders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_folders_user_deleted ON folders(user_id, is_deleted);

-- Update existing folders to have is_deleted = false
UPDATE folders SET is_deleted = FALSE WHERE is_deleted IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN folders.is_deleted IS 'Flag to mark folders as deleted (soft delete)';
COMMENT ON COLUMN folders.deleted_at IS 'Timestamp when the folder was moved to trash';

-- Update composite indexes to include trash filtering
DROP INDEX IF EXISTS idx_folders_user_version;
CREATE INDEX idx_folders_user_version ON folders(user_id, version_id) WHERE is_deleted = false;
