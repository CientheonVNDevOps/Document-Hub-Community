-- Add INSERT policy for user_approval_requests table
-- This allows anyone to create registration requests
-- Run this in your Supabase SQL Editor

-- First, ensure RLS is enabled on the table
ALTER TABLE user_approval_requests ENABLE ROW LEVEL SECURITY;

-- Drop the policy if it already exists and recreate it
DROP POLICY IF EXISTS "Anyone can create approval requests" ON user_approval_requests;

-- Create the INSERT policy - allows anyone to create approval requests
CREATE POLICY "Anyone can create approval requests" ON user_approval_requests
    FOR INSERT WITH CHECK (true);

-- Success message
SELECT '✅ INSERT policy added successfully! Registration should now work.' AS message;
