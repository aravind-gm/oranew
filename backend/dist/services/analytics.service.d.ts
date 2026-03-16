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
export declare function getOverviewAnalytics(): Promise<OverviewAnalytics>;
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
export declare function getProductAnalytics(): Promise<ProductAnalytics>;
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
export declare function getPaymentAnalytics(): Promise<PaymentAnalytics>;
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
export declare function getCartAnalytics(): Promise<CartAnalytics>;
export interface AOVAnalytics {
    aovToday: number;
    aov7Days: number;
    aov30Days: number;
    aovTrend: number;
    bundleAttachmentRate: number;
    avgItemsPerOrder: number;
    highValueOrderRate: number;
    revenuePerCustomer: number;
}
export declare function getAOVAnalytics(): Promise<AOVAnalytics>;
//# sourceMappingURL=analytics.service.d.ts.map