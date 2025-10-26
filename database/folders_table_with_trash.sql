-- Complete folders table structure with trash functionality
-- This script creates the folders table with all necessary columns including trash functionality
-- Run this in your Supabase SQL editor

-- Drop existing table if it exists (BE CAREFUL - this will delete all data!)
-- DROP TABLE IF EXISTS public.folders CASCADE;

-- Create the folders table with trash functionality
CREATE TABLE IF NOT EXISTS public.folders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(255) NOT NULL,
  parent_id uuid NULL,
  user_id uuid NOT NULL,
  description text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  version character varying(50) NULL DEFAULT 'latest'::character varying,
  is_versioned boolean NULL DEFAULT false,
  version_id uuid NULL,
  -- Trash functionality columns
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamp with time zone NULL,
  
  CONSTRAINT folders_pkey PRIMARY KEY (id),
  CONSTRAINT folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES folders (id) ON DELETE CASCADE,
  CONSTRAINT folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT folders_version_id_fkey FOREIGN KEY (version_id) REFERENCES community_versions (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON public.folders USING btree (parent_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_folders_version ON public.folders USING btree (version) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_folders_is_versioned ON public.folders USING btree (is_versioned) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_folders_version_id ON public.folders USING btree (version_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_folders_user_version ON public.folders USING btree (user_id, version_id) WHERE is_deleted = false TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_folders_user_id_version ON public.folders USING btree (user_id, version_id) TABLESPACE pg_default;

-- Trash-specific indexes
CREATE INDEX IF NOT EXISTS idx_folders_is_deleted ON public.folders USING btree (is_deleted) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_folders_deleted_at ON public.folders USING btree (deleted_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_folders_user_deleted ON public.folders USING btree (user_id, is_deleted) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_folders_user_version_deleted ON public.folders USING btree (user_id, version_id, is_deleted) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_folders_version_deleted ON public.folders USING btree (version_id, is_deleted) TABLESPACE pg_default;

-- Create triggers
CREATE OR REPLACE FUNCTION create_initial_folder_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Your trigger logic here
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS create_initial_folder_version_trigger ON public.folders;
CREATE TRIGGER create_initial_folder_version_trigger
  AFTER UPDATE ON public.folders
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_folder_version();

DROP TRIGGER IF EXISTS update_folders_updated_at ON public.folders;
CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.folders IS 'Folders table with soft delete functionality';
COMMENT ON COLUMN public.folders.is_deleted IS 'Flag to mark folders as deleted (soft delete)';
COMMENT ON COLUMN public.folders.deleted_at IS 'Timestamp when the folder was moved to trash';

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'folders' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
