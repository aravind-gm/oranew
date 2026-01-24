# Cron Jobs & Background Tasks Implementation Guide

## Overview
Background tasks are critical for maintaining system health, cleaning up resources, and sending timely notifications. This guide covers all cron jobs needed for the ORA Jewellery platform.

## Task Categories

### 1. **Inventory Management**

#### Cleanup Expired Inventory Locks
**Frequency**: Every 5 minutes
**Priority**: HIGH
**Impact**: Prevents stale locks from blocking inventory

```typescript
// Implementation
import { cleanupExpiredLocks } from '../utils/inventory';

setInterval(async () => {
  try {
    const count = await cleanupExpiredLocks();
    if (count > 0) {
      console.log(`[Cron] Cleaned up ${count} expired inventory locks`);
    }
  } catch (error) {
    console.error('[Cron Error] Failed to cleanup inventory locks:', error);
  }
}, 5 * 60 * 1000); // 5 minutes
```

**Database Impact**:
```sql
DELETE FROM inventory_locks WHERE expires_at < NOW()
```

#### Stock Level Monitoring
**Frequency**: Every hour
**Priority**: MEDIUM
**Impact**: Alerts admin to low stock items

```typescript
import { getLowStockProducts } from '../utils/inventory';

setInterval(async () => {
  try {
    const lowStockItems = await getLowStockProducts(5); // threshold = 5
    
    if (lowStockItems.length > 0) {
      // Send notification to admin
      await sendAdminNotification({
        type: 'LOW_STOCK_ALERT',
        items: lowStockItems,
      });
    }
  } catch (error) {
    console.error('[Cron Error] Failed to check stock levels:', error);
  }
}, 60 * 60 * 1000); // 1 hour
```

### 2. **Payment Management**

#### Webhook Timeout Handling
**Frequency**: Every 10 minutes
**Priority**: HIGH
**Impact**: Recovers from webhook delivery failures

```typescript
setInterval(async () => {
  try {
    // Find payments that are PENDING for > 10 minutes
    const stalePayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: new Date(Date.now() - 10 * 60 * 1000),
        },
      },
    });

    for (const payment of stalePayments) {
      // Try to fetch payment status from Razorpay
      const razorpayPayment = await razorpay.payments.fetch(payment.transactionId);
      
      if (razorpayPayment.status === 'captured') {
        // Webhook was successful but didn't get processed
        await confirmPaymentFromWebhook(razorpayPayment);
      } else if (razorpayPayment.status === 'failed') {
        // Payment failed
        await handleFailedPayment(payment.id);
      }
    }
  } catch (error) {
    console.error('[Cron Error] Failed to handle stale payments:', error);
  }
}, 10 * 60 * 1000); // 10 minutes
```

#### Payment Success Email
**Frequency**: Immediate (triggered on webhook)
**Priority**: HIGH
**Impact**: Customer confirmation receipt

```typescript
// In webhook handler
await sendEmail({
  to: user.email,
  subject: `Order Confirmation - ${order.orderNumber}`,
  html: getOrderConfirmationTemplate({
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    estimatedDelivery: getEstimatedDeliveryDate(),
    items: order.items,
  }),
});
```

### 3. **Notification Management**

#### Order Status Updates
**Frequency**: On status change (real-time)
**Priority**: HIGH
**Impact**: Keeps customers informed

```typescript
// States that trigger notifications:
// - ORDER_PLACED (on checkout)
// - ORDER_CONFIRMED (on payment webhook)
// - ORDER_SHIPPED (admin updates status)
// - ORDER_DELIVERED (webhook from courier API)
// - ORDER_CANCELLED (admin/customer action)
// - RETURN_APPROVED (admin review)

async function notifyCustomer(orderId, status) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  const notificationMap = {
    CONFIRMED: {
      type: 'ORDER_CONFIRMED',
      title: 'Order Confirmed',
      message: 'Your payment has been received and order is being prepared.',
    },
    SHIPPED: {
      type: 'ORDER_SHIPPED',
      title: 'Order Shipped',
      message: `Your order is on the way. Tracking: ${order.trackingNumber}`,
    },
    DELIVERED: {
      type: 'ORDER_DELIVERED',
      title: 'Order Delivered',
      message: 'Your order has been delivered. Please confirm receipt.',
    },
  };

  const notif = notificationMap[status];
  if (!notif) return;

  await prisma.notification.create({
    data: {
      userId: order.userId,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    },
  });

  // Also send email
  await sendEmail({
    to: order.user.email,
    subject: notif.title,
    html: getNotificationTemplate(notif),
  });
}
```

#### Unread Notification Cleanup
**Frequency**: Daily at 2 AM
**Priority**: LOW
**Impact**: Database maintenance

```typescript
setInterval(async () => {
  try {
    const result = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days old
        },
      },
    });

    console.log(`[Cron] Cleaned up ${result.count} old notifications`);
  } catch (error) {
    console.error('[Cron Error] Failed to cleanup notifications:', error);
  }
}, 24 * 60 * 60 * 1000); // 24 hours
```

### 4. **Password Reset**

#### Cleanup Expired Password Reset Tokens
**Frequency**: Every hour
**Priority**: MEDIUM
**Impact**: Security, database cleanup

```typescript
setInterval(async () => {
  try {
    const result = await prisma.passwordReset.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    if (result.count > 0) {
      console.log(`[Cron] Cleaned up ${result.count} expired password reset tokens`);
    }
  } catch (error) {
    console.error('[Cron Error] Failed to cleanup password resets:', error);
  }
}, 60 * 60 * 1000); // 1 hour
```

### 5. **User & Account Management**

#### Inactive User Cleanup
**Frequency**: Monthly (1st of month)
**Priority**: LOW
**Impact**: Database cleanup

```typescript
setInterval(async () => {
  try {
    // Delete unverified accounts older than 30 days
    const result = await prisma.user.deleteMany({
      where: {
        isVerified: false,
        createdAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    console.log(`[Cron] Cleaned up ${result.count} unverified accounts`);
  } catch (error) {
    console.error('[Cron Error] Failed to cleanup inactive users:', error);
  }
}, 30 * 24 * 60 * 60 * 1000); // 30 days
```

### 6. **Analytics & Reporting**

#### Daily Sales Summary
**Frequency**: Daily at 6 PM
**Priority**: LOW
**Impact**: Business intelligence

```typescript
setInterval(async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailySalesData = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: today,
        },
        status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    });

    // Store in analytics table or send email
    await sendAdminEmail({
      subject: `Daily Sales Report - ${today.toDateString()}`,
      html: generateSalesReport(dailySalesData),
    });
  } catch (error) {
    console.error('[Cron Error] Failed to generate sales report:', error);
  }
}, 24 * 60 * 60 * 1000);
```

## Implementation Approaches

### Option 1: Node.js Native (node-cron)

```typescript
import cron from 'node-cron';

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  await cleanupExpiredLocks();
});

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  // cleanup task
});
```

**Pros**: Simple, no external service needed
**Cons**: Only works when Node process is running, no persistence

### Option 2: External Queue (Bull/BullMQ)

```typescript
import Bull from 'bull';

const inventoryQueue = new Bull('inventory', {
  redis: {
    host: 'localhost',
    port: 6379,
  },
});

// Schedule recurring job
inventoryQueue.add(
  { task: 'cleanupExpiredLocks' },
  {
    repeat: {
      every: 5 * 60 * 1000, // 5 minutes
    },
  }
);

// Process jobs
inventoryQueue.process(async (job) => {
  if (job.data.task === 'cleanupExpiredLocks') {
    await cleanupExpiredLocks();
  }
});
```

**Pros**: Persistent, distributed, retry logic
**Cons**: Requires Redis, more complex setup

### Option 3: Separate Cron Service

```typescript
// Background service
import schedule from 'node-schedule';

function startCronJobs() {
  // Every 5 minutes
  schedule.scheduleJob('*/5 * * * *', async () => {
    await cleanupExpiredLocks();
  });

  // Every hour
  schedule.scheduleJob('0 * * * *', async () => {
    await checkLowStockProducts();
  });

  // Daily at 2 AM
  schedule.scheduleJob('0 2 * * *', async () => {
    await cleanupOldNotifications();
  });

  console.log('[Cron] All background jobs started');
}

export { startCronJobs };
```

**Call in server.ts**:
```typescript
import { startCronJobs } from './services/cron';

app.listen(PORT, () => {
  startCronJobs();
  console.log(`Server running on port ${PORT}`);
});
```

## Monitoring & Alerting

### Health Check Endpoint

```typescript
app.get('/api/health/cron', (_req, res) => {
  const cronStatus = {
    lastCleanup: lastCleanupTime,
    lastStockCheck: lastStockCheckTime,
    uptime: process.uptime(),
    tasksCompleted: {
      inventoryCleanup: cleanupCount,
      stockAlerts: alertCount,
      paymentRetries: retryCount,
    },
  };

  res.json(cronStatus);
});
```

### Error Logging

```typescript
const cronLogger = {
  log: (taskName, status, message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${taskName}] ${status}: ${message}`);
    
    // Also store in database for auditing
    prisma.cronLog.create({
      data: {
        taskName,
        status,
        message,
        executedAt: new Date(),
      },
    });
  },
};
```

## Recommended Cron Jobs Summary

| Task | Frequency | Priority | Implementation |
|------|-----------|----------|-----------------|
| Cleanup Expired Locks | 5 min | HIGH | node-cron |
| Stock Level Check | 1 hour | MEDIUM | node-cron |
| Webhook Timeout Handler | 10 min | HIGH | Bull |
| Password Reset Cleanup | 1 hour | MEDIUM | node-cron |
| Notification Cleanup | Daily 2 AM | LOW | node-cron |
| Sales Report | Daily 6 PM | LOW | node-cron |
| Unverified User Cleanup | Monthly | LOW | node-cron |

## Best Practices

1. **Error Handling**: Always wrap in try-catch
2. **Logging**: Log start, end, and any errors
3. **Idempotency**: Jobs must be safe to run multiple times
4. **Timeouts**: Set reasonable timeouts for long-running tasks
5. **Monitoring**: Track job execution times and failure rates
6. **Documentation**: Comment what each job does and why
7. **Testing**: Test cron logic separately from schedule
8. **Resource Cleanup**: Always release connections and resources

## Testing Cron Jobs

```typescript
// Test file
describe('Cron Jobs', () => {
  it('should cleanup expired locks', async () => {
    // Create expired lock
    const expiredLock = await prisma.inventoryLock.create({
      data: {
        productId: 'test-product',
        quantity: 1,
        expiresAt: new Date(Date.now() - 1000), // Expired
      },
    });

    // Run cleanup
    const count = await cleanupExpiredLocks();

    expect(count).toBe(1);

    // Verify lock is deleted
    const lock = await prisma.inventoryLock.findUnique({
      where: { id: expiredLock.id },
    });
    expect(lock).toBeNull();
  });
});
```

## Deployment Considerations

1. **Single Instance**: Run cron jobs only on one server instance
2. **Load Balancing**: Use distributed locking if multiple instances
3. **Time Sync**: Ensure all servers have synchronized clocks (NTP)
4. **Backup Instance**: Have standby for critical jobs
5. **Monitoring**: Alert if job doesn't complete within expected time

## Future Enhancements

- [ ] Redis-based distributed locking for multi-instance deployments
- [ ] Dashboard for viewing cron job execution history
- [ ] Slack/Discord notifications for job failures
- [ ] Dynamic cron schedule updates without restart
- [ ] Performance metrics collection
- [ ] Automatic retry with exponential backoff
