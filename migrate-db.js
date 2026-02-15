#!/usr/bin/env node
/**
 * Database Migration Script
 * Runs gift collections migration using Node.js PostgreSQL client
 * Usage: node migrate-db.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection string
const DATABASE_URL = 'postgresql://postgres.hgejomvgldqnqzkgffoi:9EtOmJae6YyUxXx2@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres?sslmode=require';

// Read migration SQL file
const migrationPath = path.join(__dirname, 'backend', 'migrations', 'add_gift_collections.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('🔗 Connecting to Supabase database...');
console.log('   Project: hgejomvgldqnqzkgffoi');
console.log('');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('❌ Pool error:', err);
  process.exit(1);
});

async function runMigration() {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to database');
    console.log('');
    
    console.log('📝 Running migration...');
    console.log('   Adding: collections (text[])');
    console.log('   Adding: occasions (text[])');
    console.log('   Adding: is_featured_gift (boolean)');
    console.log('');
    
    await client.query(migrationSQL);
    
    console.log('✅ Migration executed successfully!');
    console.log('');
    
    // Verify columns were created
    console.log('📊 Verifying columns...');
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'products'
      AND column_name IN ('collections', 'occasions', 'is_featured_gift')
      ORDER BY ordinal_position DESC
    `);
    
    if (result.rows.length === 3) {
      console.log('✅ All 3 columns created successfully!');
      console.log('');
      console.log('Columns:');
      result.rows.forEach(row => {
        console.log(`  ✓ ${row.column_name}`);
        console.log(`    Type: ${row.data_type}`);
        if (row.column_default) {
          console.log(`    Default: ${row.column_default}`);
        }
      });
    } else {
      console.log(`⚠️  Only ${result.rows.length} columns found (expected 3)`);
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
    }
    
    console.log('');
    console.log('🎉 Migration complete!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Rebuild backend: cd backend && npm run build');
    console.log('   2. Tag products in admin: /admin/v2/products');
    console.log('   3. View page: /collections/gifts-for-her');
    
  } catch (error) {
    console.error('❌ Migration failed!');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    
    if (error.code === 'ENOENT') {
      console.error('⚠️  Could not find migration file at:', migrationPath);
    } else if (error.message.includes('password')) {
      console.error('⚠️  Authentication failed. Check your database credentials.');
    }
    
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runMigration();
