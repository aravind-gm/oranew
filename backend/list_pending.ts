import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const payments = await prisma.payment.findMany({
    where: {
      status: 'PENDING',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
    include: {
      order: true,
    },
  });

  console.log('--- RECENT PENDING PAYMENTS ---');
  payments.forEach((p) => {
    console.log({
      id: p.id,
      orderId: p.orderId,
      orderNumber: p.order.orderNumber,
      transactionId: p.transactionId, // This is razorpay_order_id
      amount: p.amount,
      createdAt: p.createdAt,
    });
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
