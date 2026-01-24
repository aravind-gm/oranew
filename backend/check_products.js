const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const total = await prisma.product.count();
  const active = await prisma.product.count({ where: { isActive: true } });
  const inactive = await prisma.product.count({ where: { isActive: false } });
  
  console.log('=== Product Status Summary ===');
  console.log(`Total: ${total}, Active: ${active}, Inactive: ${inactive}`);
  
  console.log('\n=== First 5 Products ===');
  const products = await prisma.product.findMany({
    take: 5,
    select: { id: true, name: true, isActive: true, stockQuantity: true, categoryId: true }
  });
  console.log(JSON.stringify(products, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
