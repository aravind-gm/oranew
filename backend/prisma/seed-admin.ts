// Seed Admin User for ORA Jewellery
// Run with: npx ts-node prisma/seed-admin.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin user...');

  const adminEmail = 'admin@orashop.in';
  const adminPassword = 'admin123';
  
  // Hash the password
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  
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
