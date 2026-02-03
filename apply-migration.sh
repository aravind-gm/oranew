#!/bin/bash
# Manual SQL application for Supabase - Run locally to fix P2011

# This script applies the password_hash nullable migration manually via psql
# Use this if prisma migrate deploy fails due to authentication issues

set -e

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Install PostgreSQL client tools."
    exit 1
fi

# Parse database URL
# Expected format: postgresql://user:password@host:port/database

DB_URL="${DIRECT_URL:-postgresql://postgres.hgejomvgldqnqzkgffoi:OrAgLoBaL%4025@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres}"

echo "🔌 Connecting to database..."
echo "Host: db.hgejomvgldqnqzkgffoi.supabase.co:5432"
echo ""

# Apply the migration
psql "$DB_URL" << EOF
-- Make password_hash nullable for OTP users
-- OTP-authenticated users do not have passwords

ALTER TABLE "users"
ALTER COLUMN "password_hash" DROP NOT NULL;

SELECT 'Migration applied: password_hash is now nullable' AS result;
EOF

echo ""
echo "✅ Migration completed successfully!"
echo "✅ OTP users can now be created without passwords"
echo ""
echo "Next: Test OTP login - it should now work without P2011 errors"
