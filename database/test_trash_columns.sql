-- Test script to verify trash columns exist in folders table
-- Run this in your Supabase SQL editor to check if the migration was successful

-- Check if trash columns exist
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

-- Test inserting a folder with trash columns
INSERT INTO public.folders (name, user_id, is_deleted, deleted_at)
VALUES ('Test Folder', '00000000-0000-0000-0000-000000000000', false, null)
ON CONFLICT DO NOTHING;

-- Test soft delete functionality
UPDATE public.folders 
SET is_deleted = true, deleted_at = now()
WHERE name = 'Test Folder' 
LIMIT 1;

-- Check the result
SELECT id, name, is_deleted, deleted_at 
FROM public.folders 
WHERE name = 'Test Folder';

-- Clean up test data
DELETE FROM public.folders WHERE name = 'Test Folder';
