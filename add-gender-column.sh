#!/bin/bash

# Add missing gender column to users table in Supabase
# This script uses psql to run SQL directly against the database

echo "🔧 Adding gender column to users table..."

# Execute the SQL directly using the DIRECT_URL (bypasses PgBouncer)
psql "$DIRECT_URL" << 'EOF'
-- Add gender column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50);

-- Confirm column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'gender';

EOF

if [ $? -eq 0 ]; then
    echo "✅ Gender column added successfully!"
else
    echo "❌ Failed to add gender column"
    exit 1
fi
