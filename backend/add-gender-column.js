#!/usr/bin/env node

/**
 * Add missing gender column to users table
 * Connects directly to Supabase using DIRECT_URL
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function addGenderColumn() {
  try {
    const prisma = new PrismaClient();

    console.log('🔧 Adding gender column to users table...');

    // Execute raw SQL using Prisma's raw query capability
    await prisma.$executeRawUnsafe(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
    `);

    console.log('✅ Gender column added successfully!');

    // Verify the column exists
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'gender';
    `);

    if (result && result.length > 0) {
      console.log('✨ Column verification:', result[0]);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error adding gender column:', error.message);
    process.exit(1);
  }
}

addGenderColumn();
