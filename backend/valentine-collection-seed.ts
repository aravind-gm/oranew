import { PrismaClient } from '@prisma/client';

// Simple slugify function
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding Valentine\'s Day Drinkware Collection...');

  // Create Drinkware Category
  console.log('Creating drinkware category...');
  
  const drinkwareCategory = await prisma.category.upsert({
    where: { slug: 'drinkware' },
    update: {},
    create: {
      name: 'Drinkware',
      slug: 'drinkware',
      description: 'Premium tumblers, cups, and drinkware for everyday elegance',
      isActive: true,
      sortOrder: 10,
    },
  });

  console.log('✅ Drinkware category created');

  // Create Valentine's Day drinkware products
  console.log('Creating Valentine\'s Day drinkware products...');

  const valentineProducts = [
    {
      name: 'Everyday Love Cup',
      description: 'Simple. Thoughtful. Always there. Hydration meets heart. The Everyday Love Cup is designed for daily use — office desks, long drives, and cozy evenings. Minimal, elegant, and built to last. Keeps drinks hot & cold for hours with lightweight & easy-grip handle. Perfect everyday Valentine gift with spill-resistant lid. ✨ A sweet reminder with every sip.',
      shortDescription: 'Stanley-style tumbler for everyday elegance and hydration',
      price: 999,
      discountPercent: 0,
      categoryId: drinkwareCategory.id,
      material: 'Stainless Steel, BPA-Free',
      careInstructions: 'Hand wash recommended. Dishwasher safe (top rack). Do not microwave.',
      weight: '450g',
      dimensions: 'Height: 25cm, Diameter: 8cm, Capacity: 500ml',
      stockQuantity: 100,
      isFeatured: true,
    },
    {
      name: 'Marble Love Cup',
      description: 'A little luxury, made to last. Turn everyday hydration into a statement. The Marble Love Cup features a premium swirl finish that feels as good as it looks — elegant, modern, and gift-worthy. Premium marble finish (no two alike) with double-wall insulated steel. Elegant pastel tones for Valentine gifting that feels luxurious and looks exclusive. 💖 Because love deserves something special.',
      shortDescription: 'Premium marble finish tumbler with luxury aesthetic',
      price: 1499,
      discountPercent: 0,
      categoryId: drinkwareCategory.id,
      material: 'Double-Wall Stainless Steel, Marble Finish',
      careInstructions: 'Hand wash only to preserve marble finish. Do not use abrasive cleaners.',
      weight: '520g',
      dimensions: 'Height: 26cm, Diameter: 8.5cm, Capacity: 600ml',
      stockQuantity: 75,
      isFeatured: true,
    },
    {
      name: 'Ultimate Valentine Gift Box',
      description: 'The gift that says "I went all out." This is not just a cup — it\'s a complete Valentine experience. Beautifully packed, thoughtfully curated, and ready to impress the moment it\'s opened. What\'s inside: Premium Marble Quencher Cup, Floral-themed gift box, Soft velvet carry pouch, Ready-to-gift presentation. 🎀 Unbox love. Keep memories. Perceived value = ₹3,200+ → Selling at ₹2,499',
      shortDescription: 'Complete Valentine gift experience with premium marble cup, gift box & accessories',
      price: 2499,
      discountPercent: 0,
      categoryId: drinkwareCategory.id,
      material: 'Premium Marble Finish Steel Cup, Velvet Pouch, Luxury Gift Box',
      careInstructions: 'Hand wash cup only. Store accessories in provided pouch. Gift box for presentation only.',
      weight: '750g (complete set)',
      dimensions: 'Gift Box: 30cm x 15cm x 15cm, Cup: Height 26cm, Diameter 8.5cm',
      stockQuantity: 50,
      isFeatured: true,
    },
  ];

  for (const product of valentineProducts) {
    const finalPrice = product.price - (product.price * product.discountPercent) / 100;
    const { categoryId, ...productData } = product;
    
    const dataToCreate: any = {
      ...productData,
      finalPrice,
      slug: slugify(product.name),
      sku: `VAL-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
      metaTitle: `${product.name} - Valentine's Day Special | ORA`,
      metaDescription: product.shortDescription,
      category: {
        connect: { id: categoryId }
      }
    };
    
    await prisma.product.create({
      data: dataToCreate,
    });
  }

  console.log('✅ Valentine\'s Day drinkware products created');

  // Create Valentine Collection tag/metadata
  console.log('Adding Valentine special tags...');
  
  // You could add collection metadata here if you have a collections table
  // For now, we'll use the category approach

  console.log('\n🎉 Valentine\'s Day Drinkware Collection added successfully!\n');
  console.log('📝 Products created:');
  console.log('   • Everyday Love Cup - ₹999');
  console.log('   • Marble Love Cup - ₹1,499');
  console.log('   • Ultimate Valentine Gift Box - ₹2,499');
}

main()
  .catch((e) => {
    console.error('❌ Valentine collection seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });