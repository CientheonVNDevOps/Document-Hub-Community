-- Migration: Add trash functionality to folders table
-- This script adds soft delete functionality to the folders table
-- Run this in your Supabase SQL editor

-- Add trash columns to folders table
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_folders_is_deleted ON public.folders(is_deleted) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_folders_deleted_at ON public.folders(deleted_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_folders_user_deleted ON public.folders(user_id, is_deleted) TABLESPACE pg_default;

-- Update existing folders to have is_deleted = false
UPDATE public.folders SET is_deleted = FALSE WHERE is_deleted IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.folders.is_deleted IS 'Flag to mark folders as deleted (soft delete)';
COMMENT ON COLUMN public.folders.deleted_at IS 'Timestamp when the folder was moved to trash';

-- Update composite indexes to include trash filtering
-- Drop existing index if it exists
DROP INDEX IF EXISTS idx_folders_user_version;
-- Create new index with trash filtering
CREATE INDEX idx_folders_user_version ON public.folders(user_id, version_id) 
WHERE is_deleted = false TABLESPACE pg_default;

-- Create additional composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_folders_user_version_deleted ON public.folders(user_id, version_id, is_deleted) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_folders_version_deleted ON public.folders(version_id, is_deleted) TABLESPACE pg_default;

-- Add constraint to ensure is_deleted is not null
ALTER TABLE public.folders ALTER COLUMN is_deleted SET NOT NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'folders' 
    AND table_schema = 'public'
    AND column_name IN ('is_deleted', 'deleted_at')
ORDER BY column_name;
