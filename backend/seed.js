const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

async function main() {
  console.log('🌱 Starting database seed...');

  // Admin password MUST come from environment variable
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass || adminPass.length < 8) {
    console.error('❌ ADMIN_PASSWORD env var is required (min 8 chars). Set it before seeding.');
    console.error('   Example: ADMIN_PASSWORD="YourSecurePass123" npx prisma db seed');
    process.exit(1);
  }

  console.log('Creating admin user...');
  const adminPasswordHash = await hashPassword(adminPass);

  await prisma.user.upsert({
    where: { email: 'admin@orashop.in' },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: 'admin@orashop.in',
      passwordHash: adminPasswordHash,
      fullName: 'Admin',
      phone: '9842253984',
      role: 'ADMIN',
      isVerified: true,
      profileCompleted: true,
    },
  });

  console.log('✅ Admin user created/updated');

  // Create Categories
  console.log('Creating categories...');

  const categories = [
    { name: 'Necklaces', description: 'Elegant necklaces for every occasion' },
    { name: 'Earrings', description: 'Beautiful earrings to complement your style' },
    { name: 'Bracelets', description: 'Graceful bracelets and bangles' },
    { name: 'Rings', description: 'Stunning rings for your fingers' },
    { name: 'Pendants', description: 'Delicate pendants to express your style' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: slugify(cat.name) },
      update: {},
      create: {
        name: cat.name,
        slug: slugify(cat.name),
        description: cat.description,
        isActive: true,
      },
    });
  }

  console.log('✅ Categories created');
  console.log('🎉 Seeding completed! Add real products via admin panel.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
