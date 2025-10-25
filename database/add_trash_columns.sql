-- Add trash functionality columns to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Create index for better performance on trash queries
CREATE INDEX IF NOT EXISTS idx_notes_is_deleted ON notes(is_deleted);
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at);

-- Update existing notes to have is_deleted = false
UPDATE notes SET is_deleted = FALSE WHERE is_deleted IS NULL;
