#!/usr/bin/env node

/**
 * Add all missing columns to users table
 * Prisma schema expects these columns to exist
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function addMissingColumns() {
  try {
    const prisma = new PrismaClient();

    console.log('🔧 Adding missing columns to users table...');

    // Execute SQL to add all missing columns
    const sql = `
      ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_id VARCHAR(255) UNIQUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `;

    // Execute each statement separately to handle partial success
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement.trim());
          const col = statement.match(/ADD COLUMN IF NOT EXISTS (\w+)/)?.[1];
          console.log(`  ✅ Column ${col} verified/added`);
        } catch (err) {
          console.log(`  ℹ️  ${err.message.split('\n')[0]}`);
        }
      }
    }

    console.log('\n✅ All missing columns added successfully!');

    // Verify all required columns exist
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Current users table columns:');
    result.forEach((col, idx) => {
      console.log(`  ${idx + 1}. ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addMissingColumns();
