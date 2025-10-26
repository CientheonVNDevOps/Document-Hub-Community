-- Version System Migration for Community Folders
-- This migration adds a community-wide version system similar to Next.js docs

-- Create community_versions table
CREATE TABLE community_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add version_id to folders table
ALTER TABLE folders ADD COLUMN version_id UUID REFERENCES community_versions(id) ON DELETE SET NULL;

-- Add version_id to notes table  
ALTER TABLE notes ADD COLUMN version_id UUID REFERENCES community_versions(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_community_versions_created_at ON community_versions(created_at);
CREATE INDEX idx_folders_version_id ON folders(version_id);
CREATE INDEX idx_notes_version_id ON notes(version_id);

-- Composite indexes for better query performance
CREATE INDEX idx_notes_user_version ON notes(user_id, version_id) WHERE is_deleted = false;
CREATE INDEX idx_folders_user_version ON folders(user_id, version_id);
CREATE INDEX idx_notes_folder_version ON notes(folder_id, version_id) WHERE is_deleted = false;

-- Update existing indexes to include version_id for better performance
DROP INDEX IF EXISTS idx_notes_user_id;
DROP INDEX IF EXISTS idx_notes_folder_id;
DROP INDEX IF EXISTS idx_folders_user_id;

-- Recreate indexes with version support
CREATE INDEX idx_notes_user_id_version ON notes(user_id, version_id);
CREATE INDEX idx_notes_folder_id_version ON notes(folder_id, version_id);
CREATE INDEX idx_folders_user_id_version ON folders(user_id, version_id);

-- Create trigger for updated_at on community_versions
CREATE TRIGGER update_community_versions_updated_at BEFORE UPDATE ON community_versions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for community_versions
ALTER TABLE community_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_versions
-- All authenticated users can view versions
CREATE POLICY "Users can view community versions" ON community_versions
    FOR SELECT USING (true);

-- Only admins can create, update, delete versions
CREATE POLICY "Admins can create community versions" ON community_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update community versions" ON community_versions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete community versions" ON community_versions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Insert default version
INSERT INTO community_versions (name, description, created_by) 
SELECT 'v1.0', 'Initial version', id 
FROM users 
WHERE role = 'admin' 
LIMIT 1;

-- Update existing folders and notes to use the default version
UPDATE folders 
SET version_id = (SELECT id FROM community_versions WHERE name = 'v1.0' LIMIT 1)
WHERE version_id IS NULL;

UPDATE notes 
SET version_id = (SELECT id FROM community_versions WHERE name = 'v1.0' LIMIT 1)
WHERE version_id IS NULL;
