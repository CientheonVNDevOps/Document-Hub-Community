#!/bin/bash

# Version System Setup Script
# This script sets up the community versions table and related functionality

set -e

echo "🚀 Setting up community versions system..."

# Check if .env file exists in the backend directory
ENV_FILE="apps/backend/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env file not found in apps/backend/"
    echo "Please run the main database setup first: cd apps/backend && ./scripts/setup-database.sh"
    exit 1
fi

# Load environment variables from .env file
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set in .env file"
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
if [[ $SUPABASE_URL == postgresql://* ]]; then
    DB_URL="$SUPABASE_URL"
    echo "📋 Using full database connection string"
else
    PROJECT_REF=$(echo $SUPABASE_URL | sed 's/.*\/\/\([^.]*\)\.supabase\.co.*/\1/')
    
    if [ -z "$PROJECT_REF" ]; then
        echo "❌ Error: Could not extract project reference from SUPABASE_URL"
        exit 1
    fi
    
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
echo "🚀 Running version system migration..."

# Check if version migration file exists
VERSION_MIGRATION_FILE="database/version_system_migration.sql"

if [ ! -f "$VERSION_MIGRATION_FILE" ]; then
    echo "❌ Error: Version migration file not found at $VERSION_MIGRATION_FILE"
    exit 1
fi

echo "📄 Version migration file found: $VERSION_MIGRATION_FILE"

# Execute the version system migration
if psql "$DB_URL" -f "$VERSION_MIGRATION_FILE"; then
    echo ""
    echo "✅ Community versions system setup completed successfully!"
    echo ""
    echo "📊 New tables and features:"
    echo "   - community_versions (for version management)"
    echo "   - version_id columns added to folders and notes"
    echo "   - Default version 'v1.0' created"
    echo "   - RLS policies for version access control"
    echo "   - Performance indexes for version queries"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Restart your backend server: cd apps/backend && bun run dev"
    echo "   2. The sidebar should now show the version dropdown"
    echo "   3. Community folders will be organized by version"
else
    echo ""
    echo "❌ Error: Failed to execute version system migration"
    echo "Please check your database credentials and try again"
    exit 1
fi
