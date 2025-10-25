#!/bin/bash

# Add trash functionality columns to the database
echo "Adding trash functionality columns to notes table..."

# Check if we're in the right directory
if [ ! -f "database/add_trash_columns.sql" ]; then
    echo "Error: database/add_trash_columns.sql not found. Please run this script from the project root."
    exit 1
fi

# Run the migration
echo "Executing database migration..."
psql -h localhost -U postgres -d notehub -f database/add_trash_columns.sql

if [ $? -eq 0 ]; then
    echo "✅ Trash columns added successfully!"
    echo "Added columns: is_deleted, deleted_at"
    echo "Created indexes for better performance"
else
    echo "❌ Failed to add trash columns"
    exit 1
fi
