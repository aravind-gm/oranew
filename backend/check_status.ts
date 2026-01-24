import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const transactionId = 'order_S3SloBTKXx3ths';
  const payment = await prisma.payment.findFirst({
    where: {
      transactionId: transactionId,
    },
    include: {
      order: true
    }
  });

  if (payment) {
    console.log('--- PAYMENT STATUS ---');
    console.log({
      id: payment.id,
      transactionId: payment.transactionId,
      status: payment.status,
      orderPaymentStatus: payment.order.paymentStatus,
      amount: payment.amount
    });
  } else {
    console.log('Payment not found');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
