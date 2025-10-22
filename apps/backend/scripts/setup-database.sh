#!/bin/bash

# Database Setup Script for TakingNoteCommunityCientheon
# This script sets up the database schema with all required tables

set -e

echo "🚀 Setting up database schema..."

# Check if .env file exists in the backend directory
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env file not found in apps/backend/"
    echo ""
    echo "📝 Please create a .env file in apps/backend/ with the following content:"
    echo ""
    echo "SUPABASE_URL=your_supabase_url"
    echo "SUPABASE_ANON_KEY=your_supabase_anon_key"
    echo "JWT_SECRET=gaWf1KNftWLkipJa3IfiJiHG4mjvjQE8DH5Z/ntCt7mWP5o73pWfgZKxMA6CTO4QTa34Q6RHAR2erucZJnAfZA=="
    echo "RESEND_API_KEY=your_resend_api_key"
    echo "ADMIN_EMAIL=nhatlinh.lykny@gmail.com"
    echo ""
    echo "💡 You can copy from env.example:"
    echo "   cp env.example .env"
    echo "   # Then edit .env with your actual values"
    exit 1
fi

# Load environment variables from .env file
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set in .env file"
    exit 1
fi

# Check if environment variables still have placeholder values
if [ "$SUPABASE_URL" = "your_supabase_url" ] || [ "$SUPABASE_ANON_KEY" = "your_supabase_anon_key" ]; then
    echo "❌ Error: Please update your .env file with actual Supabase credentials"
    echo ""
    echo "📝 Current .env file contains placeholder values:"
    echo "   SUPABASE_URL=$SUPABASE_URL"
    echo "   SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"
    echo ""
    echo "🔧 Please edit .env file and replace with your actual values:"
    echo "   1. Go to your Supabase project dashboard"
    echo "   2. Copy your project URL and anon key"
    echo "   3. Update the .env file with real values"
    echo ""
    echo "💡 Example:"
    echo "   SUPABASE_URL=https://abcdefghijklmnop.supabase.co"
    echo "   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql command not found. Please install PostgreSQL client tools."
    echo "On macOS: brew install postgresql"
    echo "On Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Extract database connection details from Supabase URL
# Check if SUPABASE_URL is a full database connection string or just the project URL
if [[ $SUPABASE_URL == postgresql://* ]]; then
    # It's a full database connection string, extract project reference from it
    PROJECT_REF=$(echo $SUPABASE_URL | sed 's/.*postgres\.\([^.]*\)\..*/\1/')
    DB_URL="$SUPABASE_URL"
    echo "📋 Using full database connection string"
else
    # It's a Supabase project URL, extract project reference
    PROJECT_REF=$(echo $SUPABASE_URL | sed 's/.*\/\/\([^.]*\)\.supabase\.co.*/\1/')
    
    if [ -z "$PROJECT_REF" ]; then
        echo "❌ Error: Could not extract project reference from SUPABASE_URL"
        echo "Expected format: https://your-project.supabase.co"
        echo "Or full database URL: postgresql://postgres.user:password@host:port/database"
        exit 1
    fi
fi

echo "📋 Project Reference: $PROJECT_REF"
echo "🔗 Supabase URL: $SUPABASE_URL"

# Check if schema file exists
SCHEMA_FILE="../../database/schema.sql"
MIGRATION_FILE="../../database/migration.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Error: Schema file not found at $SCHEMA_FILE"
    exit 1
fi

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found at $MIGRATION_FILE"
    exit 1
fi

echo "📄 Schema file found: $SCHEMA_FILE"
echo "📄 Migration file found: $MIGRATION_FILE"

# Handle database password and URL construction
if [[ $SUPABASE_URL == postgresql://* ]]; then
    # Full database URL already provided, no need to prompt for password
    echo "📋 Using provided database connection string"
else
    # Prompt for database password
    echo ""
    echo "🔐 Please enter your Supabase database password:"
    echo "   (You can find this in your Supabase project dashboard > Settings > Database)"
    read -s DB_PASSWORD

    if [ -z "$DB_PASSWORD" ]; then
        echo "❌ Error: Database password is required"
        exit 1
    fi

    # Construct the database URL
    DB_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"
fi

echo ""
echo "🚀 Running database migration..."

# Execute the migration first (for existing databases)
if psql "$DB_URL" -f "$MIGRATION_FILE"; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🚀 Executing full database schema..."

    # Execute the full schema
    if psql "$DB_URL" -f "$SCHEMA_FILE"; then
        echo ""
        echo "✅ Database schema setup completed successfully!"
        echo ""
        echo "📊 Tables created:"
        echo "   - users (with admin account: nhatlinh.lykny@gmail.com)"
        echo "   - user_approval_requests (for admin approval workflow)"
        echo "   - folders (for organizing notes)"
        echo "   - notes (with versioning)"
        echo "   - note_versions (for note history)"
        echo "   - otp_codes (for OTP verification)"
        echo ""
        echo "🔐 Security features:"
        echo "   - Row Level Security (RLS) policies enabled"
        echo "   - Proper indexes for performance"
        echo "   - Triggers for automatic timestamp updates"
        echo "   - Full-text search capabilities"
        echo ""
        echo "👤 Default admin account created:"
        echo "   Email: nhatlinh.lykny@gmail.com"
        echo "   Password: Admin123!"
        echo ""
        echo "🎯 Next steps:"
        echo "   1. Start the backend server: bun run dev"
        echo "   2. Start the frontend server: cd ../../frontend && bun run dev"
        echo "   3. Login as admin to manage user approvals"
    else
        echo ""
        echo "❌ Error: Failed to execute database schema"
        echo "Please check your database credentials and try again"
        exit 1
    fi
else
    echo ""
    echo "❌ Error: Failed to execute database migration"
    echo "Please check your database credentials and try again"
    exit 1
fi