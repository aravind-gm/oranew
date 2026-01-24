const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Helper functions
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

  // Create Admin User
  console.log('Creating admin user...');
  const adminPassword = await hashPassword('admin123');
  
  await prisma.user.upsert({
    where: { email: 'admin@orashop.in' },
    update: {},
    create: {
      email: 'admin@orashop.in',
      passwordHash: adminPassword,
      fullName: 'Admin User',
      phone: '9876543210',
      role: 'ADMIN',
      isVerified: true,
    },
  });

  console.log('✅ Admin user created');

  // Create Categories
  console.log('Creating categories...');
  
  const categories = [
    { name: 'Necklaces', description: 'Elegant necklaces for every occasion' },
    { name: 'Earrings', description: 'Beautiful earrings to complement your style' },
    { name: 'Bracelets', description: 'Graceful bracelets and bangles' },
    { name: 'Rings', description: 'Stunning rings for your fingers' },
    { name: 'Jewellery Sets', description: 'Complete matching jewellery sets' },
  ];

  const createdCategories = {};
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(cat.name) },
      update: {},
      create: {
        name: cat.name,
        slug: slugify(cat.name),
        description: cat.description,
        isActive: true,
      },
    });
    createdCategories[cat.name] = category.id;
  }

  console.log('✅ Categories created');

  // Create Sample Products
  console.log('Creating sample products...');

  const products = [
    {
      name: 'Gold Plated Necklace Set',
      category: 'Necklaces',
      price: 15999,
      description: 'Beautiful gold plated necklace with matching earrings',
      stock: 50,
      images: ['https://placehold.co/600x600/FFD700/000000/png?text=Gold+Necklace'],
    },
    {
      name: 'Silver Jhumka Earrings',
      category: 'Earrings',
      price: 2999,
      description: 'Traditional silver jhumka earrings',
      stock: 100,
      images: ['https://placehold.co/600x600/C0C0C0/000000/png?text=Silver+Jhumka'],
    },
    {
      name: 'Diamond Studded Ring',
      category: 'Rings',
      price: 25999,
      description: 'Elegant diamond studded ring',
      stock: 30,
      images: ['https://placehold.co/600x600/B9F2FF/000000/png?text=Diamond+Ring'],
    },
    {
      name: 'Pearl Bracelet',
      category: 'Bracelets',
      price: 4999,
      description: 'Classic pearl bracelet',
      stock: 75,
      images: ['https://placehold.co/600x600/FFF0F5/000000/png?text=Pearl+Bracelet'],
    },
    {
      name: 'Bridal Jewellery Set',
      category: 'Jewellery Sets',
      price: 49999,
      description: 'Complete bridal jewellery set with necklace, earrings, and maang tikka',
      stock: 20,
      images: ['https://placehold.co/600x600/FFD700/000000/png?text=Bridal+Set'],
    },
    {
      name: 'Gold Hoop Earrings',
      category: 'Earrings',
      price: 3499,
      description: 'Modern gold hoop earrings',
      stock: 60,
      images: ['https://placehold.co/600x600/FFD700/000000/png?text=Gold+Hoops'],
    },
    {
      name: 'Temple Jewellery Necklace',
      category: 'Necklaces',
      price: 12999,
      description: 'Traditional temple jewellery necklace',
      stock: 40,
      images: ['https://placehold.co/600x600/DAA520/000000/png?text=Temple+Necklace'],
    },
    {
      name: 'Silver Anklet',
      category: 'Bracelets',
      price: 1999,
      description: 'Delicate silver anklet',
      stock: 90,
      images: ['https://placehold.co/600x600/C0C0C0/000000/png?text=Silver+Anklet'],
    },
  ];

  for (const product of products) {
    const categoryId = createdCategories[product.category];
    if (!categoryId) {
      console.error(`Category not found: ${product.category}`);
      continue;
    }

    const slug = slugify(product.name);
    const sku = `SKU-${slug.toUpperCase().substring(0, 10)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const discountPercent = product.discount || 0;
    const finalPrice = product.price * (1 - discountPercent / 100);

    const createdProduct = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: product.name,
        slug,
        sku,
        description: product.description,
        price: product.price,
        discountPercent,
        finalPrice,
        stockQuantity: product.stock,
        categoryId: categoryId,
        isActive: true,
        isFeatured: Math.random() > 0.5, // Random featured products
      },
    });

    // Add product images
    if (product.images && product.images.length > 0) {
      for (let i = 0; i < product.images.length; i++) {
        await prisma.productImage.upsert({
          where: { 
            id: `${createdProduct.id}-${i}`
          },
          update: {},
          create: {
            productId: createdProduct.id,
            imageUrl: product.images[i],
            altText: product.name,
            sortOrder: i,
            isPrimary: i === 0,
          },
        });
      }
    }
  }

  console.log('✅ Sample products created');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
