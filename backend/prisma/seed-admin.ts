// Seed Admin User for ORA Jewellery
// Run with: ADMIN_PASSWORD="YourPass" npx ts-node prisma/seed-admin.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin user...');

  const adminEmail = 'admin@orashop.in';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || adminPassword.length < 8) {
    console.error('❌ ADMIN_PASSWORD env var is required (min 8 chars).');
    process.exit(1);
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  
  // Upsert admin user
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: 'ADMIN',
      isVerified: true,
      profileCompleted: true,
      fullName: 'Admin',
    },
    create: {
      email: adminEmail,
      passwordHash,
      fullName: 'Admin',
      role: 'ADMIN',
      isVerified: true,
      profileCompleted: true,
    },
  });

  console.log('✅ Admin user created/updated:', {
    id: admin.id,
    email: admin.email,
    role: admin.role,
  });
}

main()
  .catch((e) => {
    console.error('❌ Error seeding admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
