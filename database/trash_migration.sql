-- Migration: Add trash functionality to notes table
-- Run this in your Supabase SQL editor

-- Add trash columns to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_is_deleted ON notes(is_deleted);
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at);
CREATE INDEX IF NOT EXISTS idx_notes_user_deleted ON notes(user_id, is_deleted);

-- Update existing notes to have is_deleted = false
UPDATE notes SET is_deleted = FALSE WHERE is_deleted IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN notes.is_deleted IS 'Flag to mark notes as deleted (soft delete)';
COMMENT ON COLUMN notes.deleted_at IS 'Timestamp when the note was moved to trash';
