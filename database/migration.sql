-- Migration script to update existing database schema
-- This script adds the new columns and tables needed for the admin approval system

-- Add status column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'status') THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
    END IF;
END $$;

-- Create user_approval_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_approval_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to otp_codes table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'otp_codes' AND column_name = 'used') THEN
        ALTER TABLE otp_codes ADD COLUMN used BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create indexes for user approval requests if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_approval_requests_email ON user_approval_requests(email);
CREATE INDEX IF NOT EXISTS idx_user_approval_requests_status ON user_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_approval_requests_requested_at ON user_approval_requests(requested_at);

-- Create index for users status if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Update existing users to have approved status
UPDATE users SET status = 'approved' WHERE status IS NULL;

-- Create the default admin account if it doesn't exist
-- Check if name column exists, if not use first_name and last_name
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'name') THEN
        -- Table has name column
        INSERT INTO users (email, password, name, role, status) VALUES (
            'nhatlinh.lykny@gmail.com',
            '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA',
            'Admin User',
            'admin',
            'approved'
        ) ON CONFLICT (email) DO NOTHING;
    ELSE
        -- Table has first_name and last_name columns
        INSERT INTO users (email, password, first_name, last_name, role, status) VALUES (
            'nhatlinh.lykny@gmail.com',
            '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA',
            'Admin',
            'User',
            'admin',
            'approved'
        ) ON CONFLICT (email) DO NOTHING;
    END IF;
END $$;

-- Add RLS policies for user_approval_requests if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_approval_requests' AND policyname = 'Admins can view all approval requests') THEN
        ALTER TABLE user_approval_requests ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Admins can view all approval requests" ON user_approval_requests
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id::text = auth.uid()::text 
                    AND users.role = 'admin'
                )
            );
            
        CREATE POLICY "Admins can update approval requests" ON user_approval_requests
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id::text = auth.uid()::text 
                    AND users.role = 'admin'
                )
            );
    END IF;
END $$;
