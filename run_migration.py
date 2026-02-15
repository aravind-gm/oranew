#!/usr/bin/env python3
"""
Run migration using psycopg2 which properly handles URLs
"""
import os
import sys

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("❌ psycopg2 not installed. Install with: pip install psycopg2-binary")
    sys.exit(1)

# Read migration SQL
with open('backend/migrations/add_gift_collections.sql', 'r') as f:
    migration_sql = f.read()

# Get database URL from .env
database_url = os.getenv('DATABASE_URL')
if not database_url:
    print("❌ DATABASE_URL not set")
    print("Please set: export DATABASE_URL='...' from your .env file")
    sys.exit(1)

# Remove pgbouncer parameters if present (not compatible with psycopg2)
database_url = database_url.replace('?pgbouncer=true&connection_limit=1', '')
database_url = database_url.replace('&pgbouncer=true', '')
database_url = database_url.replace('?connection_limit=1', '')

print(f"🔗 Connecting to database...")
print(f"   Host: {database_url.split('@')[1].split(':')[0]}")

try:
    conn = psycopg2.connect(database_url, sslmode='require')
    cursor = conn.cursor()
    
    print("✅ Connected!")
    print("📝 Running migration...")
    
    cursor.execute(migration_sql)
    conn.commit()
    
    print("✅ Migration completed successfully!")
    print("")
    print("📊 Verifying columns...")
    
    cursor.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name IN ('collections', 'occasions', 'is_featured_gift')
        ORDER BY ordinal_position;
    """)
    
    results = cursor.fetchall()
    if len(results) == 3:
        print("✅ All 3 columns created successfully!")
        for col_name, data_type in results:
            print(f"   - {col_name}: {data_type}")
    else:
        print(f"⚠️  Only {len(results)} columns found (expected 3)")
    
    cursor.close()
    conn.close()
    
except psycopg2.OperationalError as e:
    print(f"❌ Connection failed: {e}")
    print("\nTroubleshooting:")
    print("1. Check your DATABASE_URL is correct")
    print("2. Check network/firewall connectivity")
    print("3. Verify Supabase project is running")
    sys.exit(1)
except psycopg2.ProgrammingError as e:
    print(f"❌ SQL Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
