/**
 * ORA Jewellery — Payment Parity Audit
 * /deploy/payment-audit.ts
 *
 * Compares confirmed orders vs confirmed payments.
 * Logs CRITICAL if any mismatch is detected.
 *
 * Usage:
 *   cd backend && npx tsx ../deploy/payment-audit.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const prisma = new PrismaClient();

async function run() {
  console.log('\n  ORA Payment Parity Audit');
  console.log('  ' + new Date().toISOString());
  console.log('  ────────────────────────────────────────');

  // Confirmed orders
  const confirmedOrders = await prisma.order.count({
    where: { status: 'CONFIRMED' },
  });

  // Confirmed payments (non-COD)
  const confirmedPayments = await prisma.payment.count({
    where: { status: 'CONFIRMED' },
  });

  // COD orders (no payment record needed — always match themselves)
  const codOrders = await prisma.order.count({
    where: { status: 'CONFIRMED', paymentMethod: 'COD' },
  });

  // Online confirmed orders = total confirmed - COD
  const onlineConfirmed = confirmedOrders - codOrders;

  console.log(`  Confirmed Orders (total):    ${confirmedOrders}`);
  console.log(`  COD Orders:                  ${codOrders}`);
  console.log(`  Online Confirmed Orders:     ${onlineConfirmed}`);
  console.log(`  Confirmed Payments:          ${confirmedPayments}`);

  const mismatch = onlineConfirmed - confirmedPayments;

  if (mismatch !== 0) {
    console.error(`\n  ❌ CRITICAL: PAYMENT PARITY MISMATCH`);
    console.error(`     ${Math.abs(mismatch)} order(s) have no matching confirmed payment`);

    // Find mismatched order IDs
    const confirmedOrderIds = await prisma.order.findMany({
      where: { status: 'CONFIRMED', paymentMethod: { not: 'COD' } },
      select: { id: true, orderNumber: true, createdAt: true, totalAmount: true },
    });

    const confirmedPaymentOrderIds = await prisma.payment.findMany({
      where: { status: 'CONFIRMED' },
      select: { orderId: true },
    });

    const paymentOrderIdSet = new Set(confirmedPaymentOrderIds.map((p) => p.orderId));

    const unmatched = confirmedOrderIds.filter((o) => !paymentOrderIdSet.has(o.id));

    if (unmatched.length > 0) {
      console.error('\n  Orders without confirmed payment:');
      for (const o of unmatched) {
        console.error(
          `     - ${o.orderNumber} | ${o.id} | ₹${Number(o.totalAmount)} | ${o.createdAt.toISOString()}`
        );
      }
    }

    await prisma.$disconnect();
    process.exit(1);
  } else {
    console.log('\n  ✅ Payment parity OK — all online confirmed orders have confirmed payments');
  }

  await prisma.$disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('\n  ❌ Audit script error:', err);
  prisma.$disconnect();
  process.exit(1);
});
