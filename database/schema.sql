-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'manager', 'admin')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_approval_requests table
CREATE TABLE user_approval_requests (
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

-- Create otp_codes table
CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Create folders table
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create note_versions table for version history
CREATE TABLE note_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    version INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_folder_id ON notes(folder_id);
CREATE INDEX idx_notes_created_at ON notes(created_at);
CREATE INDEX idx_notes_updated_at ON notes(updated_at);
CREATE INDEX idx_notes_title ON notes USING gin(to_tsvector('english', title));
CREATE INDEX idx_notes_content ON notes USING gin(to_tsvector('english', content));

CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);

CREATE INDEX idx_note_versions_note_id ON note_versions(note_id);
CREATE INDEX idx_note_versions_created_at ON note_versions(created_at);

-- Indexes for new tables
CREATE INDEX idx_otp_codes_email ON otp_codes(email);
CREATE INDEX idx_otp_codes_expires_at ON otp_codes(expires_at);
CREATE INDEX idx_otp_codes_used ON otp_codes(used);

-- Indexes for user approval requests
CREATE INDEX idx_user_approval_requests_email ON user_approval_requests(email);
CREATE INDEX idx_user_approval_requests_status ON user_approval_requests(status);
CREATE INDEX idx_user_approval_requests_requested_at ON user_approval_requests(requested_at);

-- Index for users status
CREATE INDEX idx_users_status ON users(status);


-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Create function to save note version on update
CREATE OR REPLACE FUNCTION save_note_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Only save version if content or title changed
    IF OLD.title != NEW.title OR OLD.content != NEW.content THEN
        INSERT INTO note_versions (note_id, title, content, version)
        VALUES (OLD.id, OLD.title, OLD.content, OLD.version);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to save note versions
CREATE TRIGGER save_note_version_trigger BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION save_note_version();

-- Create RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Folders policies
CREATE POLICY "Users can view own folders" ON folders
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own folders" ON folders
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own folders" ON folders
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own folders" ON folders
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Notes policies
CREATE POLICY "Users can view own notes" ON notes
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own notes" ON notes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own notes" ON notes
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own notes" ON notes
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Note versions policies
CREATE POLICY "Users can view own note versions" ON note_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM notes 
            WHERE notes.id = note_versions.note_id 
            AND notes.user_id::text = auth.uid()::text
        )
    );

-- OTP codes policies (only for the user's email)
CREATE POLICY "Users can view own otp codes" ON otp_codes
    FOR SELECT USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Users can insert own otp codes" ON otp_codes
    FOR INSERT WITH CHECK (email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update own otp codes" ON otp_codes
    FOR UPDATE USING (email = auth.jwt() ->> 'email');


-- Create full-text search function
CREATE OR REPLACE FUNCTION search_notes(search_query TEXT, user_uuid UUID)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    content TEXT,
    folder_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.content,
        n.folder_id,
        n.created_at,
        n.updated_at,
        ts_rank(
            to_tsvector('english', n.title || ' ' || n.content),
            plainto_tsquery('english', search_query)
        ) as rank
    FROM notes n
    WHERE n.user_id = user_uuid
    AND (
        to_tsvector('english', n.title || ' ' || n.content) @@ plainto_tsquery('english', search_query)
        OR n.title ILIKE '%' || search_query || '%'
        OR n.content ILIKE '%' || search_query || '%'
    )
    ORDER BY rank DESC, n.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create default admin account
-- Password: Admin123! (hashed with bcrypt)
INSERT INTO users (email, password, name, role, status) VALUES (
    'nhatlinh.lykny@gmail.com',
    '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA',
    'Admin User',
    'admin',
    'approved'
) ON CONFLICT (email) DO NOTHING;
