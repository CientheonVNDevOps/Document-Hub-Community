-- Migration to assign existing folders and notes to Version 1
-- This ensures that all existing content belongs to the first version

-- First, get the ID of the first version (Version 1)
-- We'll use a subquery to get the version with name 'v1.0' or the first created version
DO $$
DECLARE
    version_1_id UUID;
BEGIN
    -- Get the ID of Version 1 (either by name 'v1.0' or the first created version)
    SELECT id INTO version_1_id 
    FROM community_versions 
    WHERE name = 'v1.0' 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- If no version with name 'v1.0' exists, get the first created version
    IF version_1_id IS NULL THEN
        SELECT id INTO version_1_id 
        FROM community_versions 
        ORDER BY created_at ASC 
        LIMIT 1;
    END IF;
    
    -- If we still don't have a version, create one
    IF version_1_id IS NULL THEN
        INSERT INTO community_versions (name, description, created_by) 
        VALUES ('v1.0', 'Initial version', (SELECT id FROM users WHERE role = 'admin' LIMIT 1))
        RETURNING id INTO version_1_id;
    END IF;
    
    -- Update all existing folders to belong to Version 1
    UPDATE folders 
    SET version_id = version_1_id 
    WHERE version_id IS NULL;
    
    -- Update all existing notes to belong to Version 1
    UPDATE notes 
    SET version_id = version_1_id 
    WHERE version_id IS NULL;
    
    -- Log the results
    RAISE NOTICE 'Assigned % folders and % notes to version %', 
        (SELECT COUNT(*) FROM folders WHERE version_id = version_1_id),
        (SELECT COUNT(*) FROM notes WHERE version_id = version_1_id),
        version_1_id;
END $$;
