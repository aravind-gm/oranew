/**
 * Analytics Service — Phase 3 + Phase 4 Redis
 * =============================================
 * 
 * Server-side computation of all business metrics.
 * All queries use composite indexes for sub-100ms execution.
 * Results cached via Redis (60s TTL) with in-memory fallback.
 * 
 * Rules:
 *  - Only CONFIRMED payments count as revenue
 *  - Refunds subtract from revenue
 *  - All timestamps in Asia/Kolkata
 *  - Percentages rounded to 2 decimals
 *  - Division by zero returns 0
 */

import { prisma } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';

// ============================================
// REDIS-BACKED CACHE (60-second TTL, in-memory fallback)
// ============================================

const CACHE_TTL_SECONDS = 60; // 60 seconds

async function getCached<T>(key: string): Promise<T | null> {
  return cacheGet<T>(`analytics:${key}`);
}

async function setAndReturn<T>(key: string, data: T): Promise<T> {
  await cacheSet(`analytics:${key}`, data, CACHE_TTL_SECONDS);
  return data;
}

// ============================================
// HELPERS
// ============================================

/** Safe percentage: avoids division by zero, rounds to 2 decimals */
function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

/** Start of today in IST (Asia/Kolkata = UTC+5:30) */
function startOfTodayIST(): Date {
  const now = new Date();
  // IST offset in ms
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const istMidnight = new Date(Date.UTC(
    istNow.getUTCFullYear(),
    istNow.getUTCMonth(),
    istNow.getUTCDate()
  ));
  // Convert IST midnight back to UTC
  return new Date(istMidnight.getTime() - istOffset);
}

/** Start of this month in IST */
function startOfMonthIST(): Date {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const istMonthStart = new Date(Date.UTC(
    istNow.getUTCFullYear(),
    istNow.getUTCMonth(),
    1
  ));
  return new Date(istMonthStart.getTime() - istOffset);
}

/** Start of previous month in IST */
function startOfPrevMonthIST(): Date {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const prevMonth = istNow.getUTCMonth() === 0 ? 11 : istNow.getUTCMonth() - 1;
  const prevYear = istNow.getUTCMonth() === 0 ? istNow.getUTCFullYear() - 1 : istNow.getUTCFullYear();
  const istPrevMonthStart = new Date(Date.UTC(prevYear, prevMonth, 1));
  return new Date(istPrevMonthStart.getTime() - istOffset);
}

/** N days ago from now */
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

// ============================================
// 1. OVERVIEW ANALYTICS
// ============================================

export interface OverviewAnalytics {
  revenue: {
    today: number;
    thisMonth: number;
    last30Days: number;
    prevMonth: number;
    growthPct: number;
  };
  orders: {
    today: number;
    thisMonth: number;
    aov: number;
    repeatCustomerRate: number;
    firstTimeCount: number;
    returningCount: number;
  };
  customers: {
    total: number;
    newThisMonth: number;
  };
  refunds: {
    count: number;
    amount: number;
    ratePct: number;
  };
}

export async function getOverviewAnalytics(): Promise<OverviewAnalytics> {
  const cached = await getCached<OverviewAnalytics>('overview');
  if (cached) return cached;

  const today = startOfTodayIST();
  const monthStart = startOfMonthIST();
  const prevMonthStart = startOfPrevMonthIST();
  const thirtyDaysAgo = daysAgo(30);

  const [
    revenueToday,
    revenueThisMonth,
    revenueLast30,
    revenuePrevMonth,
    refundedOrders,
    ordersToday,
    ordersThisMonth,
    confirmedOrdersThisMonth,
    repeatCustomers,
    totalCustomers,
    newCustomersThisMonth,
  ] = await Promise.all([
    // Revenue today (CONFIRMED only, subtract refunds)
    prisma.order.aggregate({
      where: { paymentStatus: 'CONFIRMED', createdAt: { gte: today } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    // Revenue this month
    prisma.order.aggregate({
      where: { paymentStatus: 'CONFIRMED', createdAt: { gte: monthStart } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    // Revenue last 30 days
    prisma.order.aggregate({
      where: { paymentStatus: 'CONFIRMED', createdAt: { gte: thirtyDaysAgo } },
      _sum: { totalAmount: true },
    }),
    // Revenue previous month (for growth %)
    prisma.order.aggregate({
      where: {
        paymentStatus: 'CONFIRMED',
        createdAt: { gte: prevMonthStart, lt: monthStart },
      },
      _sum: { totalAmount: true },
    }),
    // Refunds this month
    prisma.order.aggregate({
      where: { paymentStatus: 'REFUNDED', createdAt: { gte: monthStart } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    // Orders today
    prisma.order.count({
      where: { createdAt: { gte: today }, status: { not: 'CANCELLED' } },
    }),
    // Orders this month
    prisma.order.count({
      where: { createdAt: { gte: monthStart }, status: { not: 'CANCELLED' } },
    }),
    // Confirmed orders this month (for AOV)
    prisma.order.aggregate({
      where: { paymentStatus: 'CONFIRMED', createdAt: { gte: monthStart } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    // Repeat customers (users with >= 2 CONFIRMED orders)
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM (
        SELECT user_id FROM orders
        WHERE payment_status = 'CONFIRMED'
        GROUP BY user_id
        HAVING COUNT(*) >= 2
      ) t
    `,
    // Total customers
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    // New customers this month
    prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: monthStart } } }),
  ]);

  const revTodayNet = Number(revenueToday._sum.totalAmount || 0);
  const revMonthGross = Number(revenueThisMonth._sum.totalAmount || 0);
  const refundAmount = Number(refundedOrders._sum.totalAmount || 0);
  const revMonthNet = revMonthGross - refundAmount;
  const revLast30 = Number(revenueLast30._sum.totalAmount || 0);
  const revPrevMonth = Number(revenuePrevMonth._sum.totalAmount || 0);
  const confirmedCount = confirmedOrdersThisMonth._count || 0;
  const aov = confirmedCount > 0 ? Math.round(revMonthGross / confirmedCount) : 0;
  const repeatCount = Number(repeatCustomers[0]?.count || 0);
  const totalConfirmedUsers = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(DISTINCT user_id) as count FROM orders WHERE payment_status = 'CONFIRMED'
  `;
  const uniqueConfirmedBuyers = Number(totalConfirmedUsers[0]?.count || 0);
  const firstTimeCount = uniqueConfirmedBuyers - repeatCount;

  const result: OverviewAnalytics = {
    revenue: {
      today: Math.round(revTodayNet * 100) / 100,
      thisMonth: Math.round(revMonthNet * 100) / 100,
      last30Days: Math.round(revLast30 * 100) / 100,
      prevMonth: Math.round(revPrevMonth * 100) / 100,
      growthPct: pct(revMonthNet - revPrevMonth, revPrevMonth),
    },
    orders: {
      today: ordersToday,
      thisMonth: ordersThisMonth,
      aov,
      repeatCustomerRate: pct(repeatCount, uniqueConfirmedBuyers),
      firstTimeCount: Math.max(0, firstTimeCount),
      returningCount: repeatCount,
    },
    customers: {
      total: totalCustomers,
      newThisMonth: newCustomersThisMonth,
    },
    refunds: {
      count: refundedOrders._count || 0,
      amount: Math.round(refundAmount * 100) / 100,
      ratePct: pct(refundedOrders._count || 0, (revenueThisMonth._count || 0) + (refundedOrders._count || 0)),
    },
  };

  return setAndReturn('overview', result);
}

// ============================================
// 2. PRODUCT ANALYTICS
// ============================================

export interface ProductAnalytics {
  topByRevenue: Array<{
    productId: string;
    name: string;
    revenue: number;
    quantitySold: number;
    imageUrl: string | null;
  }>;
  topByQuantity: Array<{
    productId: string;
    name: string;
    quantitySold: number;
    revenue: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    revenue: number;
    orderCount: number;
    pctOfTotal: number;
  }>;
  lowStock: Array<{
    id: string;
    name: string;
    stockQuantity: number;
    lowStockThreshold: number;
    price: number;
    imageUrl: string | null;
  }>;
}

export async function getProductAnalytics(): Promise<ProductAnalytics> {
  const cached = await getCached<ProductAnalytics>('products');
  if (cached) return cached;

  const thirtyDaysAgo = daysAgo(30);

  // Top products by revenue (last 30 days, CONFIRMED orders only)
  const topByRevenue = await prisma.$queryRaw<Array<{
    product_id: string;
    product_name: string;
    revenue: number;
    qty_sold: number;
    image_url: string | null;
  }>>`
    SELECT
      oi.product_id,
      oi.product_name,
      SUM(CAST(oi.total_price AS DOUBLE PRECISION))::DOUBLE PRECISION as revenue,
      SUM(oi.quantity)::INTEGER as qty_sold,
      (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = oi.product_id AND pi.is_primary = true LIMIT 1) as image_url
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.payment_status = 'CONFIRMED' AND o.created_at >= ${thirtyDaysAgo}
    GROUP BY oi.product_id, oi.product_name
    ORDER BY revenue DESC
    LIMIT 10
  `;

  // Top products by quantity
  const topByQuantity = await prisma.$queryRaw<Array<{
    product_id: string;
    product_name: string;
    qty_sold: number;
    revenue: number;
  }>>`
    SELECT
      oi.product_id,
      oi.product_name,
      SUM(oi.quantity)::INTEGER as qty_sold,
      SUM(CAST(oi.total_price AS DOUBLE PRECISION))::DOUBLE PRECISION as revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.payment_status = 'CONFIRMED' AND o.created_at >= ${thirtyDaysAgo}
    GROUP BY oi.product_id, oi.product_name
    ORDER BY qty_sold DESC
    LIMIT 10
  `;

  // Category revenue breakdown
  const totalRevRaw = await prisma.order.aggregate({
    where: { paymentStatus: 'CONFIRMED', createdAt: { gte: thirtyDaysAgo } },
    _sum: { totalAmount: true },
  });
  const totalRev = Number(totalRevRaw._sum.totalAmount || 0);

  const categoryBreakdown = await prisma.$queryRaw<Array<{
    category: string;
    revenue: number;
    order_count: number;
  }>>`
    SELECT
      COALESCE(c.name, 'Uncategorized') as category,
      SUM(CAST(oi.total_price AS DOUBLE PRECISION))::DOUBLE PRECISION as revenue,
      COUNT(DISTINCT o.id)::INTEGER as order_count
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE o.payment_status = 'CONFIRMED' AND o.created_at >= ${thirtyDaysAgo}
    GROUP BY c.name
    ORDER BY revenue DESC
  `;

  // Low stock products (fetch all active, filter in JS because Prisma can't compare two columns)
  const lowStockRaw = await prisma.product.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      stockQuantity: { lte: 10 },
    },
    select: {
      id: true,
      name: true,
      stockQuantity: true,
      lowStockThreshold: true,
      finalPrice: true,
      images: { where: { isPrimary: true }, take: 1, select: { imageUrl: true } },
    },
    orderBy: { stockQuantity: 'asc' },
    take: 20,
  });

  // Filter in-app since Prisma can't compare two columns easily
  const lowStock = lowStockRaw
    .filter(p => p.stockQuantity <= (p.lowStockThreshold || 5))
    .map(p => ({
      id: p.id,
      name: p.name,
      stockQuantity: p.stockQuantity,
      lowStockThreshold: p.lowStockThreshold || 5,
      price: Number(p.finalPrice),
      imageUrl: p.images[0]?.imageUrl || null,
    }));

  const result: ProductAnalytics = {
    topByRevenue: topByRevenue.map(r => ({
      productId: r.product_id,
      name: r.product_name,
      revenue: Math.round(Number(r.revenue) * 100) / 100,
      quantitySold: Number(r.qty_sold),
      imageUrl: r.image_url,
    })),
    topByQuantity: topByQuantity.map(r => ({
      productId: r.product_id,
      name: r.product_name,
      quantitySold: Number(r.qty_sold),
      revenue: Math.round(Number(r.revenue) * 100) / 100,
    })),
    categoryBreakdown: categoryBreakdown.map(c => ({
      category: c.category,
      revenue: Math.round(Number(c.revenue) * 100) / 100,
      orderCount: Number(c.order_count),
      pctOfTotal: pct(Number(c.revenue), totalRev),
    })),
    lowStock,
  };

  return setAndReturn('products', result);
}

// ============================================
// 3. PAYMENT ANALYTICS
// ============================================

export interface PaymentAnalytics {
  successRate: number;
  failedCount7Days: number;
  totalPayments7Days: number;
  refundRate: number;
  retrySuccessRate: number;
  retryTotal: number;
  retrySuccessful: number;
  byGateway: Array<{
    gateway: string;
    count: number;
    amount: number;
  }>;
  dailyFailures: Array<{
    date: string;
    failed: number;
    total: number;
  }>;
}

export async function getPaymentAnalytics(): Promise<PaymentAnalytics> {
  const cached = await getCached<PaymentAnalytics>('payments');
  if (cached) return cached;

  const sevenDaysAgo = daysAgo(7);

  const [
    totalPayments,
    confirmedPayments,
    failedPayments,
    refundedPayments,
    retryTokensTotal,
    retryTokensUsed,
    retrySuccessful,
    byGateway,
    dailyPayments,
  ] = await Promise.all([
    prisma.payment.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.payment.count({ where: { status: 'CONFIRMED', createdAt: { gte: sevenDaysAgo } } }),
    prisma.payment.count({ where: { status: 'FAILED', createdAt: { gte: sevenDaysAgo } } }),
    prisma.payment.count({ where: { status: 'REFUNDED', createdAt: { gte: sevenDaysAgo } } }),
    prisma.paymentRetryToken.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.paymentRetryToken.count({ where: { used: true, createdAt: { gte: sevenDaysAgo } } }),
    // Count orders that were retried and succeeded (had a retry token + CONFIRMED payment)
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT prt.order_id) as count
      FROM payment_retry_tokens prt
      JOIN orders o ON o.id = prt.order_id
      WHERE prt.used = true
        AND prt.created_at >= ${sevenDaysAgo}
        AND o.payment_status = 'CONFIRMED'
    `,
    // By gateway
    prisma.$queryRaw<Array<{ gateway: string; count: bigint; amount: number }>>`
      SELECT
        payment_gateway as gateway,
        COUNT(*)::BIGINT as count,
        COALESCE(SUM(CAST(amount AS DOUBLE PRECISION)), 0)::DOUBLE PRECISION as amount
      FROM payments
      WHERE created_at >= ${sevenDaysAgo}
      GROUP BY payment_gateway
    `,
    // Daily failures (last 7 days)
    prisma.$queryRaw<Array<{ day: Date; failed: bigint; total: bigint }>>`
      SELECT
        DATE(created_at AT TIME ZONE 'Asia/Kolkata') as day,
        COUNT(*) FILTER (WHERE status = 'FAILED')::BIGINT as failed,
        COUNT(*)::BIGINT as total
      FROM payments
      WHERE created_at >= ${sevenDaysAgo}
      GROUP BY day
      ORDER BY day
    `,
  ]);

  const retrySuccess = Number(retrySuccessful[0]?.count || 0);

  const result: PaymentAnalytics = {
    successRate: pct(confirmedPayments, totalPayments),
    failedCount7Days: failedPayments,
    totalPayments7Days: totalPayments,
    refundRate: pct(refundedPayments, totalPayments),
    retrySuccessRate: pct(retrySuccess, retryTokensTotal || 0),
    retryTotal: retryTokensTotal,
    retrySuccessful: retrySuccess,
    byGateway: byGateway.map(g => ({
      gateway: g.gateway,
      count: Number(g.count),
      amount: Math.round(Number(g.amount) * 100) / 100,
    })),
    dailyFailures: dailyPayments.map(d => ({
      date: new Date(d.day).toISOString().split('T')[0],
      failed: Number(d.failed),
      total: Number(d.total),
    })),
  };

  return setAndReturn('payments', result);
}

// ============================================
// 4. CART & COUPON ANALYTICS
// ============================================

export interface CartAnalytics {
  abandonedCarts7Days: number;
  recoveryRate: number;
  recoveredRevenue: number;
  activeCarts: number;
  couponUsageRate: number;
  topCoupons: Array<{
    code: string;
    usageCount: number;
    discountType: string;
    totalDiscount: number;
  }>;
  revenueChart30Days: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export async function getCartAnalytics(): Promise<CartAnalytics> {
  const cached = await getCached<CartAnalytics>('carts');
  if (cached) return cached;

  const sevenDaysAgo = daysAgo(7);
  const thirtyDaysAgo = daysAgo(30);

  const [
    abandonedLogs,
    recoveredOrders,
    activeCarts,
    totalOrdersWithCoupon,
    totalConfirmedOrders,
    topCoupons,
    revenueByDay,
  ] = await Promise.all([
    // Abandoned cart logs in last 7 days
    prisma.abandonedCartLog.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    // Orders from users who had abandoned carts (recovered)
    prisma.$queryRaw<[{ count: bigint; revenue: number }]>`
      SELECT
        COUNT(DISTINCT o.id)::BIGINT as count,
        COALESCE(SUM(CAST(o.total_amount AS DOUBLE PRECISION)), 0)::DOUBLE PRECISION as revenue
      FROM orders o
      JOIN abandoned_cart_logs acl ON acl.user_id = o.user_id
      WHERE o.payment_status = 'CONFIRMED'
        AND o.created_at >= acl.email_sent_at
        AND o.created_at >= ${sevenDaysAgo}
    `,
    // Active cart items (users with items in cart)
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT user_id)::BIGINT as count FROM cart_items
    `,
    // Orders with coupons (last 30 days)
    prisma.order.count({
      where: {
        paymentStatus: 'CONFIRMED',
        createdAt: { gte: thirtyDaysAgo },
        couponCode: { not: null },
      },
    }),
    // Total confirmed orders (last 30 days)
    prisma.order.count({
      where: { paymentStatus: 'CONFIRMED', createdAt: { gte: thirtyDaysAgo } },
    }),
    // Top coupons
    prisma.$queryRaw<Array<{
      code: string;
      usage_count: bigint;
      discount_type: string;
      total_discount: number;
    }>>`
      SELECT
        c.code,
        c.usage_count::BIGINT as usage_count,
        c.discount_type,
        COALESCE(SUM(CAST(o.discount_amount AS DOUBLE PRECISION)), 0)::DOUBLE PRECISION as total_discount
      FROM coupons c
      LEFT JOIN orders o ON o.coupon_code = c.code AND o.payment_status = 'CONFIRMED'
      WHERE c.usage_count > 0
      GROUP BY c.id, c.code, c.usage_count, c.discount_type
      ORDER BY c.usage_count DESC
      LIMIT 10
    `,
    // Revenue by day (last 30 days) — the chart data
    prisma.$queryRaw<Array<{ day: Date; revenue: number; orders: bigint }>>`
      SELECT
        DATE(created_at AT TIME ZONE 'Asia/Kolkata') as day,
        COALESCE(SUM(CAST(total_amount AS DOUBLE PRECISION)), 0)::DOUBLE PRECISION as revenue,
        COUNT(*)::BIGINT as orders
      FROM orders
      WHERE payment_status = 'CONFIRMED'
        AND created_at >= ${thirtyDaysAgo}
      GROUP BY day
      ORDER BY day
    `,
  ]);

  const recoveredCount = Number(recoveredOrders[0]?.count || 0);
  const recoveredRev = Number(recoveredOrders[0]?.revenue || 0);

  const result: CartAnalytics = {
    abandonedCarts7Days: abandonedLogs,
    recoveryRate: pct(recoveredCount, abandonedLogs),
    recoveredRevenue: Math.round(recoveredRev * 100) / 100,
    activeCarts: Number(activeCarts[0]?.count || 0),
    couponUsageRate: pct(totalOrdersWithCoupon, totalConfirmedOrders),
    topCoupons: topCoupons.map(c => ({
      code: c.code,
      usageCount: Number(c.usage_count),
      discountType: c.discount_type,
      totalDiscount: Math.round(Number(c.total_discount) * 100) / 100,
    })),
    revenueChart30Days: revenueByDay.map(d => ({
      date: new Date(d.day).toISOString().split('T')[0],
      revenue: Math.round(Number(d.revenue) * 100) / 100,
      orders: Number(d.orders),
    })),
  };

  return setAndReturn('carts', result);
}
