#!/usr/bin/env node

/**
 * Verify database schema matches Prisma schema
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function verifySchema() {
  try {
    const prisma = new PrismaClient();

    console.log('🔍 Verifying database schema...\n');

    // Required columns based on Prisma User model
    const requiredColumns = {
      'id': 'PRIMARY KEY',
      'email': 'UNIQUE',
      'supabase_id': 'UNIQUE (optional)',
      'full_name': 'VARCHAR',
      'phone': 'VARCHAR (optional)',
      'gender': 'VARCHAR (optional)',
      'role': 'enum/VARCHAR',
      'is_verified': 'BOOLEAN',
      'profile_completed': 'BOOLEAN',
      'created_at': 'TIMESTAMP',
      'updated_at': 'TIMESTAMP',
    };

    // Get actual columns
    const actualColumns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      AND column_name IN (${Object.keys(requiredColumns).map(c => `'${c}'`).join(',')})
      ORDER BY ordinal_position;
    `);

    console.log('📋 Prisma User Model Requirements vs Database:\n');
    
    const foundColumns = actualColumns.map(c => c.column_name);
    let allGood = true;

    Object.entries(requiredColumns).forEach(([col, type]) => {
      if (foundColumns.includes(col)) {
        const dbCol = actualColumns.find(c => c.column_name === col);
        console.log(`  ✅ ${col.padEnd(20)} (${dbCol.data_type}, nullable: ${dbCol.is_nullable})`);
      } else {
        console.log(`  ❌ ${col.padEnd(20)} - MISSING!`);
        allGood = false;
      }
    });

    if (allGood) {
      console.log('\n✨ All required columns exist! Database schema is valid.');
    } else {
      console.log('\n⚠️  Some columns are missing. Run add-missing-columns.js to fix.');
      process.exit(1);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifySchema();
