import { NextFunction, Response } from 'express';
import { prisma } from '../config/database';
import { withRetry } from '../utils/retry';
import { getSignedUrl } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import {
    sendOrderConfirmedEmail,
    sendOrderDeliveredEmail,
    sendOrderShippedEmail
} from '../services/email.service';
import { cleanupExpiredLocks, restoreInventory } from '../utils/inventory';
import { normalizeSupabaseUrl } from '../utils/supabaseUrlHelper';
import { logAdminAction } from '../utils/auditLog';

// Helper function to transform image URL to CDN URL
// Handles both Supabase legacy URLs and R2/CDN URLs
function transformImageUrlToCDN(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;

  // Already a CDN URL
  if (imageUrl.includes('cdn.orashop.in')) {
    return imageUrl;
  }

  // Supabase URL - extract the filename and use CDN
  if (imageUrl.includes('supabase.co')) {
    const filenameMatch = imageUrl.match(/\/([^\/]+\.(?:jpg|jpeg|png|gif|webp))$/i);
    if (filenameMatch) {
      const filename = filenameMatch[1];
      return `${process.env.R2_PUBLIC_BASE_URL || 'https://cdn.orashop.in'}/products/${filename}`;
    }
  }

  // R2 bucket URL - transform to CDN
  if (imageUrl.includes('.r2.dev') || imageUrl.includes('r2.dev')) {
    const filenameMatch = imageUrl.match(/\/([^\/]+\.(?:jpg|jpeg|png|gif|webp))$/i);
    if (filenameMatch) {
      const filename = filenameMatch[1];
      return `${process.env.R2_PUBLIC_BASE_URL || 'https://cdn.orashop.in'}/products/${filename}`;
    }
  }

  // Relative path - prepend CDN URL
  if (!imageUrl.startsWith('http')) {
    return `${process.env.R2_PUBLIC_BASE_URL || 'https://cdn.orashop.in'}/${imageUrl}`;
  }

  // Unknown format - return as is
  return imageUrl;
}

// Helper function to transform product images to CDN URLs
async function transformProductImages(product: any) {
  if (!product.images || product.images.length === 0) {
    return product;
  }

  const transformedImages = product.images.map((img: any) => {
    if (!img.imageUrl) {
      return img;
    }

    // Transform to CDN URL
    const cdnUrl = transformImageUrlToCDN(img.imageUrl);
    return { ...img, imageUrl: cdnUrl };
  });

  return { ...product, images: transformedImages };
}

// ============================================
// DASHBOARD
// ============================================

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalOrders,
      totalRevenue,
      totalCustomers,
      pendingOrders,
      todayOrders,
      todayRevenue,
      lowStockCount,
      monthRevenue,
      topProducts,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'CONFIRMED' },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: today },
          paymentStatus: 'CONFIRMED',
        },
      }),
      prisma.product.count({
        where: {
          isActive: true,
          stockQuantity: { lte: 10 },
        },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: monthStart },
          paymentStatus: 'CONFIRMED',
        },
      }),
      // Top 5 selling products (by quantity sold)
      prisma.orderItem.groupBy({
        by: ['productId', 'productName'],
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      // Recent 7 days revenue chart data
      prisma.order.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          paymentStatus: 'CONFIRMED',
        },
        select: { createdAt: true, totalAmount: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Aggregate daily revenue for chart
    const dailyRevenue: Record<string, number> = {};
    recentOrders.forEach((order: any) => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + Number(order.totalAmount);
    });

    const revenueChart = Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue),
    }));

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalCustomers,
        pendingOrders,
        todayOrders,
        todayRevenue: todayRevenue._sum.totalAmount || 0,
        lowStockCount,
        monthRevenue: monthRevenue._sum.totalAmount || 0,
        topProducts: topProducts.map((p: any) => ({
          productId: p.productId,
          name: p.productName,
          totalSold: p._sum.quantity || 0,
          totalRevenue: Number(p._sum.totalPrice) || 0,
        })),
        revenueChart,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ORDERS MANAGEMENT
// ============================================

export const getAllOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as string;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { fullName: true, email: true, phone: true } },
          items: {
            include: {
              product: {
                select: { name: true, images: { where: { isPrimary: true }, take: 1 } },
              },
            },
          },
          shippingAddress: true,
          billingAddress: true,
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber, courierName, shiprocketOrderId, cancelReason } = req.body;

    console.log('[Admin] Updating order status:', { id, status, trackingNumber });

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      throw new AppError('Order not found', 404);
    }

    const updateData: any = {
      status,
      ...(trackingNumber !== undefined && { trackingNumber }),
      ...(courierName !== undefined && { courierName }),
      ...(shiprocketOrderId !== undefined && { shiprocketOrderId }),
      ...(status === 'SHIPPED' && { 
        shippedAt: new Date(),
        shipmentStatus: 'SHIPPED'
      }),
      ...(status === 'DELIVERED' && { 
        deliveredAt: new Date(),
        shipmentStatus: 'DELIVERED'
      }),
      ...(status === 'CANCELLED' && { 
        cancelledAt: new Date(),
        cancelReason: cancelReason || 'Cancelled by admin',
      }),
    };

    // If order is being cancelled, restore inventory
    if (status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
      try {
        // Map items to correct structure for restoreInventory
        const itemsToRestore = existingOrder.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        }));
        console.log('[Admin] Restoring inventory for order:', { orderId: id, items: itemsToRestore });
        await restoreInventory(itemsToRestore);
      } catch (invError) {
        console.error('[Admin] Inventory restore error:', invError);
        throw new AppError('Failed to restore inventory during cancellation', 500);
      }
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        items: {
          include: {
            product: {
              select: { name: true }
            }
          }
        },
        shippingAddress: true,
      },
    });

    // Send email notifications based on status change
    try {
      const emailData = {
        orderNumber: order.orderNumber,
        customerName: order.user.fullName,
        customerEmail: order.user.email,
        items: order.items.map(item => ({
          productName: item.productName || item.product?.name || 'Product',
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
        totalAmount: Number(order.totalAmount),
        shippingAddress: {
          fullName: order.shippingAddress.fullName,
          addressLine1: order.shippingAddress.addressLine1,
          addressLine2: order.shippingAddress.addressLine2 || undefined,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          pincode: order.shippingAddress.pincode,
        },
        trackingNumber: trackingNumber || order.trackingNumber || undefined,
        courierName: courierName || undefined,
      };

      // Send email based on status (fire and forget - don't block response)
      if (status === 'CONFIRMED') {
        sendOrderConfirmedEmail(emailData).catch(err => 
          console.error('Failed to send confirmed email:', err)
        );
      } else if (status === 'SHIPPED') {
        sendOrderShippedEmail(emailData).catch(err => 
          console.error('Failed to send shipped email:', err)
        );
      } else if (status === 'DELIVERED') {
        sendOrderDeliveredEmail(emailData).catch(err => 
          console.error('Failed to send delivered email:', err)
        );
      }
    } catch (emailError) {
      console.error('Email notification error:', emailError);
      // Don't fail the request if email fails
    }

    console.log('[Admin] Order status updated successfully:', { orderId: id, newStatus: status });

    // Audit log — non-blocking
    logAdminAction(req, 'UPDATE', 'ORDER', id, {
      previousStatus: existingOrder.status,
      newStatus: status,
      trackingNumber,
      courierName,
    });

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('[Admin UpdateOrderStatus Error]:', error);
    next(error);
  }
};

// ============================================
// CUSTOMERS MANAGEMENT
// ============================================

export const getCustomers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '20', search } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { role: 'CUSTOMER' };
    if (search) {
      where.OR = [
        { fullName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          createdAt: true,
          isVerified: true,
          orders: {
            select: { id: true, totalAmount: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate total spent per customer
    const customersWithStats = customers.map((customer) => ({
      ...customer,
      totalOrders: customer.orders.length,
      totalSpent: customer.orders.reduce(
        (sum, order) => sum + Number(order.totalAmount),
        0
      ),
    }));

    res.json({
      success: true,
      data: {
        customers: customersWithStats,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// INVENTORY MANAGEMENT
// ============================================

export const getLowStockProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { threshold = '10' } = req.query;
    
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stockQuantity: { lte: parseInt(threshold as string) },
      },
      include: {
        category: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { stockQuantity: 'asc' },
    });

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// Get all products for admin (including inactive)
export const getAdminProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '20', search, category, isActive, lowStock, outOfStock, archived } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // 📊 Log incoming request
    console.log('[Admin Controller] 🔍 getAdminProducts() called', {
      page,
      limit,
      hasSearch: !!search,
      hasCategory: !!category,
      hasIsActiveFilter: isActive !== undefined,
      isActive: isActive || '(no filter - see all)',
      hasLowStock: lowStock === 'true',
      hasOutOfStock: outOfStock === 'true',
      archived: archived || 'false',
      timestamp: new Date().toISOString(),
    });

    const where: any = {};

    // Archive filter: by default exclude archived, show only archived if requested
    if (archived === 'true') {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categoryId = category as string;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (lowStock === 'true') {
      where.stockQuantity = { lte: 10 };
    }

    if (outOfStock === 'true') {
      where.stockQuantity = { lte: 0 };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          images: true,
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    // 📊 Log result
    console.log('[Admin Controller] ✅ Admin products fetched', {
      totalInDatabase: total,
      returnedCount: products.length,
      page: parseInt(page as string),
      includesInactive: !where.isActive,  // ← Key insight: admin sees inactive products
      filters: {
        hasIsActiveFilter: isActive !== undefined,
        hasCategory: !!category,
        hasSearch: !!search,
        hasStockFilter: lowStock === 'true' || outOfStock === 'true',
      },
    });

    // Transform image URLs to signed URLs for reliable access
    const productsWithSignedUrls = await Promise.all(
      products.map((product) => transformProductImages(product))
    );

    res.json({
      success: true,
      data: {
        products: productsWithSignedUrls,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getInventory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '20', search, lowStock } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { isActive: true };
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (lowStock === 'true') {
      where.stockQuantity = { lte: 10 };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
          lowStockThreshold: true,
          price: true,
          category: { select: { name: true } },
          images: { where: { isPrimary: true }, take: 1 },
        },
        orderBy: { stockQuantity: 'asc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateInventory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { stockQuantity, lowStockThreshold } = req.body;

    if (stockQuantity !== undefined && stockQuantity < 0) {
      throw new AppError('Stock quantity cannot be negative', 400);
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(stockQuantity !== undefined && { stockQuantity: parseInt(stockQuantity) }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold: parseInt(lowStockThreshold) }),
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        lowStockThreshold: true,
      },
    });

    res.json({
      success: true,
      data: product,
      message: 'Inventory updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateInventory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      throw new AppError('Updates array is required', 400);
    }

    const results = await Promise.all(
      updates.map(async (update: { id: string; stockQuantity: number }) => {
        if (update.stockQuantity < 0) {
          return { id: update.id, error: 'Stock cannot be negative' };
        }
        
        try {
          const product = await prisma.product.update({
            where: { id: update.id },
            data: { stockQuantity: update.stockQuantity },
            select: { id: true, name: true, stockQuantity: true },
          });
          return { ...product, success: true };
        } catch {
          return { id: update.id, error: 'Product not found' };
        }
      })
    );

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

export const cleanupLocks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const count = await cleanupExpiredLocks();
    res.json({
      success: true,
      message: `Cleaned up ${count} expired inventory locks`,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// REPORTS & ANALYTICS
// ============================================

export const getRevenueReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;

    const now = new Date();
    let start: Date;
    let end: Date = endDate ? new Date(endDate as string) : now;

    switch (period) {
      case 'weekly':
        start = startDate
          ? new Date(startDate as string)
          : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        start = startDate
          ? new Date(startDate as string)
          : new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        start = startDate
          ? new Date(startDate as string)
          : new Date(now.getFullYear(), 0, 1);
        break;
      default: // daily
        start = startDate
          ? new Date(startDate as string)
          : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get orders within date range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        paymentStatus: 'CONFIRMED',
      },
      select: {
        createdAt: true,
        totalAmount: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const revenueByDate: Record<string, { revenue: number; orders: number }> = {};
    
    orders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (!revenueByDate[dateKey]) {
        revenueByDate[dateKey] = { revenue: 0, orders: 0 };
      }
      revenueByDate[dateKey].revenue += Number(order.totalAmount);
      revenueByDate[dateKey].orders += 1;
    });

    const chartData = Object.entries(revenueByDate).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
    }));

    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    res.json({
      success: true,
      data: {
        period,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        totalRevenue,
        totalOrders: orders.length,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        chartData,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentsReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as string;
    }

    const [payments, total, stats] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              user: { select: { fullName: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.payment.count({ where }),
      prisma.payment.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { amount: true },
      }),
    ]);

    const statusStats = stats.reduce(
      (acc, stat) => {
        acc[stat.status] = {
          count: stat._count.id,
          amount: Number(stat._sum.amount) || 0,
        };
        return acc;
      },
      {} as Record<string, { count: number; amount: number }>
    );

    res.json({
      success: true,
      data: {
        payments,
        stats: statusStats,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrdersReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    const orderStats = stats.reduce(
      (acc, stat) => {
        acc[stat.status] = {
          count: stat._count.id,
          revenue: Number(stat._sum.totalAmount) || 0,
        };
        return acc;
      },
      {} as Record<string, { count: number; revenue: number }>
    );

    const totalOrders = stats.reduce((sum, s) => sum + s._count.id, 0);
    const totalRevenue = stats.reduce(
      (sum, s) => sum + (Number(s._sum.totalAmount) || 0),
      0
    );

    res.json({
      success: true,
      data: {
        orderStats,
        totalOrders,
        totalRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CATEGORIES (Admin CRUD)
// ============================================

export const createCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, parentId, imageUrl, sortOrder } = req.body;

    if (!name) {
      throw new AppError('Category name is required', 400);
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        parentId,
        imageUrl,
        sortOrder: sortOrder || 0,
      },
    });

    logAdminAction(req, 'CREATE', 'CATEGORY', category.id, { name });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.name) {
      updateData.slug = updateData.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');
    }

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    logAdminAction(req, 'UPDATE', 'CATEGORY', id, { fields: Object.keys(updateData) });
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new AppError(
        `Cannot delete category with ${productCount} products. Move or delete products first.`,
        400
      );
    }

    await prisma.category.delete({ where: { id } });

    logAdminAction(req, 'DELETE', 'CATEGORY', id, {});
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================
// PRODUCT IMAGES MANAGEMENT
// ============================================

export const addProductImages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new AppError('Images array is required', 400);
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Get current max sort order
    const maxSortOrder = await prisma.productImage.aggregate({
      where: { productId: id },
      _max: { sortOrder: true },
    });

    let sortOrder = (maxSortOrder._max.sortOrder || 0) + 1;

    const createdImages = await Promise.all(
      images.map(async (img: { url: string; alt?: string; isPrimary?: boolean }) => {
        const image = await prisma.productImage.create({
          data: {
            productId: id,
            imageUrl: img.url,
            altText: img.alt || product.name,
            sortOrder: sortOrder++,
            isPrimary: img.isPrimary || false,
          },
        });
        return image;
      })
    );

    res.json({
      success: true,
      data: createdImages,
      message: `Added ${createdImages.length} images`,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProductImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, imageId } = req.params;

    const image = await prisma.productImage.findFirst({
      where: { id: imageId, productId: id },
    });

    if (!image) {
      throw new AppError('Image not found', 404);
    }

    await prisma.productImage.delete({ where: { id: imageId } });

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const setPrimaryImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, imageId } = req.params;

    // First, unset all primary images for this product
    await prisma.productImage.updateMany({
      where: { productId: id },
      data: { isPrimary: false },
    });

    // Set the new primary image
    const image = await prisma.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });

    res.json({ success: true, data: image });
  } catch (error) {
    next(error);
  }
};

// ============================================
// RETURNS MANAGEMENT
// ============================================

export const getReturns = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as string;
    }

    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              totalAmount: true,
              items: {
                include: {
                  product: {
                    select: { name: true, images: { where: { isPrimary: true }, take: 1 } },
                  },
                },
              },
            },
          },
          user: {
            select: { fullName: true, email: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.return.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        returns,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getReturnById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const returnRequest = await prisma.return.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  select: { name: true, sku: true, images: { where: { isPrimary: true }, take: 1 } },
                },
              },
            },
            shippingAddress: true,
            payments: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
      },
    });

    if (!returnRequest) {
      throw new AppError('Return request not found', 404);
    }

    res.json({ success: true, data: returnRequest });
  } catch (error) {
    next(error);
  }
};

export const updateReturnStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, refundAmount, restock } = req.body;

    const existingReturn = await prisma.return.findUnique({
      where: { id },
      include: { order: { include: { items: true } } },
    });

    if (!existingReturn) {
      throw new AppError('Return request not found', 404);
    }

    const updateData: any = {
      status,
      ...(adminNotes && { adminNotes }),
    };

    // Handle approval
    if (status === 'APPROVED') {
      updateData.approvedAt = new Date();
    }

    // Handle rejection
    if (status === 'REJECTED') {
      updateData.resolvedAt = new Date();
    }

    // Handle refund processing
    if (status === 'REFUNDED') {
      updateData.resolvedAt = new Date();
      updateData.refundAmount = refundAmount || existingReturn.order.totalAmount;

      // Restock inventory if requested
      if (restock) {
        await restoreInventory(existingReturn.order.items);
        updateData.restocked = true;
      }

      // Update order status
      await prisma.order.update({
        where: { id: existingReturn.orderId },
        data: { status: 'REFUNDED' },
      });

      // Update payment status
      await prisma.payment.updateMany({
        where: { orderId: existingReturn.orderId },
        data: { status: 'REFUNDED' },
      });
    }

    const updatedReturn = await prisma.return.update({
      where: { id },
      data: updateData,
      include: {
        order: { select: { orderNumber: true } },
        user: { select: { fullName: true, email: true } },
      },
    });

    res.json({ success: true, data: updatedReturn });
  } catch (error) {
    next(error);
  }
};

export const getReturnStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await prisma.return.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { refundAmount: true },
    });

    const returnStats = stats.reduce(
      (acc, stat) => {
        acc[stat.status] = {
          count: stat._count.id,
          refundedAmount: Number(stat._sum.refundAmount) || 0,
        };
        return acc;
      },
      {} as Record<string, { count: number; refundedAmount: number }>
    );

    const pendingCount = await prisma.return.count({
      where: { status: 'REQUESTED' },
    });

    res.json({
      success: true,
      data: {
        stats: returnStats,
        pendingCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// PRODUCT ARCHIVE / RESTORE
// ============================================

// @desc    Archive a product (soft delete)
// @route   PUT /api/admin/products/:id/archive
// @access  Private/Admin
export const archiveProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check for pending orders
    const pendingOrders = await prisma.orderItem.count({
      where: {
        productId: id,
        order: { status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] } },
      },
    });

    if (pendingOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot archive "${product.name}" — ${pendingOrders} pending order(s) exist.`,
      });
    }

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, bogoActive: false },
    });

    console.log('[Admin] 📦 Product archived:', { id, name: product.name });

    res.json({ success: true, message: 'Product archived successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore an archived product
// @route   PUT /api/admin/products/:id/restore
// @access  Private/Admin
export const restoreProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (!product.deletedAt) {
      return res.status(400).json({ success: false, message: 'Product is not archived' });
    }

    await prisma.product.update({
      where: { id },
      data: { deletedAt: null, isActive: false }, // Restore as draft, admin must manually activate
    });

    console.log('[Admin] ♻️ Product restored:', { id, name: product.name });

    res.json({ success: true, message: 'Product restored as draft' });
  } catch (error) {
    next(error);
  }
};

// ============================================
// BULK PRODUCT ACTIONS
// ============================================

// @desc    Bulk product actions (activate, deactivate, archive)
// @route   POST /api/admin/products/bulk-action
// @access  Private/Admin
export const bulkProductAction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { action, productIds } = req.body as {
      action: 'activate' | 'deactivate' | 'archive' | 'restore';
      productIds: string[];
    };

    if (!action || !productIds?.length) {
      return res.status(400).json({
        success: false,
        message: 'action and productIds[] are required',
      });
    }

    const validActions = ['activate', 'deactivate', 'archive', 'restore'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid action. Must be one of: ${validActions.join(', ')}`,
      });
    }

    let updateData: any = {};
    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        break;
      case 'deactivate':
        updateData = { isActive: false };
        break;
      case 'archive':
        updateData = { deletedAt: new Date(), isActive: false, bogoActive: false };
        break;
      case 'restore':
        updateData = { deletedAt: null, isActive: false };
        break;
    }

    // For archive, check pending orders first
    if (action === 'archive') {
      const pendingCount = await prisma.orderItem.count({
        where: {
          productId: { in: productIds },
          order: { status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] } },
        },
      });
      if (pendingCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot archive — ${pendingCount} pending order item(s) reference these products.`,
        });
      }
    }

    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: updateData,
    });

    console.log('[Admin] ⚡ Bulk product action:', {
      action,
      count: result.count,
      productIds,
    });

    res.json({
      success: true,
      message: `${result.count} product(s) ${action}d successfully`,
      data: { affected: result.count },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// SHIPPING CONFIG ADMIN
// ============================================

// @desc    Get shipping config for admin
// @route   GET /api/admin/settings/shipping
// @access  Private/Admin
export const getAdminShippingConfig = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const config = await prisma.shippingConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: config || { freeThreshold: 999, standardFee: 99, isActive: true },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update shipping config
// @route   PUT /api/admin/settings/shipping
// @access  Private/Admin
export const updateAdminShippingConfig = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { freeThreshold, standardFee } = req.body;

    if (freeThreshold === undefined || standardFee === undefined) {
      return res.status(400).json({
        success: false,
        message: 'freeThreshold and standardFee are required',
      });
    }

    if (freeThreshold < 0 || standardFee < 0) {
      return res.status(400).json({
        success: false,
        message: 'Values must be non-negative',
      });
    }

    // Upsert: deactivate existing, create new active config
    await prisma.shippingConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const config = await prisma.shippingConfig.create({
      data: {
        freeThreshold: parseFloat(freeThreshold),
        standardFee: parseFloat(standardFee),
        isActive: true,
      },
    });

    console.log('[Admin] 🚚 Shipping config updated:', {
      freeThreshold: config.freeThreshold,
      standardFee: config.standardFee,
    });

    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

// ============================================
// TAX CONFIG ADMIN
// ============================================

// @desc    Get all tax configs
// @route   GET /api/admin/settings/taxes
// @access  Private/Admin
export const getAdminTaxConfigs = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const configs = await prisma.taxConfig.findMany({
      orderBy: { categorySlug: 'asc' },
    });

    res.json({ success: true, data: configs });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update a tax config entry
// @route   PUT /api/admin/settings/taxes
// @access  Private/Admin
export const upsertTaxConfig = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categorySlug, gstRate, label, isActive } = req.body;

    if (!categorySlug || gstRate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'categorySlug and gstRate are required',
      });
    }

    if (gstRate < 0 || gstRate > 28) {
      return res.status(400).json({
        success: false,
        message: 'GST rate must be between 0 and 28%',
      });
    }

    const config = await prisma.taxConfig.upsert({
      where: { categorySlug },
      update: {
        gstRate: parseFloat(gstRate),
        label: label || 'GST',
        isActive: isActive !== undefined ? isActive : true,
      },
      create: {
        categorySlug,
        gstRate: parseFloat(gstRate),
        label: label || 'GST',
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // Invalidate tax cache
    const { invalidateTaxCache } = await import('../utils/tax');
    invalidateTaxCache();

    console.log('[Admin] 🧾 Tax config upserted:', {
      categorySlug,
      gstRate: config.gstRate,
    });

    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a tax config entry
// @route   DELETE /api/admin/settings/taxes/:id
// @access  Private/Admin
export const deleteTaxConfig = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.taxConfig.delete({ where: { id } });

    // Invalidate tax cache
    const { invalidateTaxCache } = await import('../utils/tax');
    invalidateTaxCache();

    console.log('[Admin] 🗑️ Tax config deleted:', { id });

    res.json({ success: true, message: 'Tax config deleted' });
  } catch (error) {
    next(error);
  }
};

// ============================================
// AUDIT LOG
// ============================================

// @desc    Get admin audit logs
// @route   GET /api/admin/audit-log
// @access  Private/Admin
export const getAuditLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '50', action, entityType } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        include: { user: { select: { id: true, fullName: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
