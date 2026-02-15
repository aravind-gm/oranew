/**
 * Security Event Logger
 * Structured logging for security-critical events
 * Prepare for future integration with SIEM systems
 */

export enum SecurityEventType {
  // Authentication Events
  TOKEN_ABUSE = 'TOKEN_ABUSE',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  TOKEN_ROTATION_FAILED = 'TOKEN_ROTATION_FAILED',
  
  // Webhook Events
  WEBHOOK_SIGNATURE_FAILED = 'WEBHOOK_SIGNATURE_FAILED',
  WEBHOOK_AMOUNT_MISMATCH = 'WEBHOOK_AMOUNT_MISMATCH',
  WEBHOOK_DUPLICATE = 'WEBHOOK_DUPLICATE',
  WEBHOOK_MISSING_SIGNATURE = 'WEBHOOK_MISSING_SIGNATURE',
  
  // Rate Limiting Events
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  
  // Payment Security
  PAYMENT_TAMPERING = 'PAYMENT_TAMPERING',
  INVALID_PAYMENT_SIGNATURE = 'INVALID_PAYMENT_SIGNATURE',
  REFUND_VIOLATION = 'REFUND_VIOLATION',
  
  // Inventory Security
  STOCK_MANIPULATION = 'STOCK_MANIPULATION',
  NEGATIVE_STOCK_ATTEMPT = 'NEGATIVE_STOCK_ATTEMPT',
  
  // Access Control
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  ADMIN_ACCESS_DENIED = 'ADMIN_ACCESS_DENIED',
  CORS_VIOLATION = 'CORS_VIOLATION',
  
  // Upload Security
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
  MALICIOUS_UPLOAD_ATTEMPT = 'MALICIOUS_UPLOAD_ATTEMPT',
}

export interface SecurityEvent {
  type: SecurityEventType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  ip?: string;
  userId?: string;
  endpoint?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

/**
 * Log security event with structured format
 * In production, this should send to monitoring system (DataDog, Sentry, etc.)
 */
export const logSecurityEvent = (event: Omit<SecurityEvent, 'timestamp'>) => {
  const fullEvent: SecurityEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // Color-coded console output for visibility
  const severityColors: Record<string, string> = {
    LOW: '\x1b[32m',      // Green
    MEDIUM: '\x1b[33m',   // Yellow
    HIGH: '\x1b[31m',     // Red
    CRITICAL: '\x1b[35m', // Magenta
  };

  const color = severityColors[event.severity] || '\x1b[0m';
  const reset = '\x1b[0m';

  console.warn(
    `${color}[SECURITY:${event.severity}]${reset}`,
    event.type,
    JSON.stringify({
      message: event.message,
      ip: event.ip,
      userId: event.userId,
      endpoint: event.endpoint,
      metadata: event.metadata,
      timestamp: fullEvent.timestamp,
    }, null, 2)
  );

  // TODO: Send to monitoring system in production
  // Examples:
  // - await datadogLogger.log(fullEvent);
  // - await sentryLogger.captureEvent(fullEvent);
  // - await elasticsearchClient.index({ index: 'security-events', body: fullEvent });
};

/**
 * Log authentication security event
 */
export const logAuthEvent = (
  type: SecurityEventType,
  message: string,
  userId?: string,
  ip?: string,
  metadata?: Record<string, any>
) => {
  logSecurityEvent({
    type,
    severity: type.includes('ABUSE') || type.includes('FAILED') ? 'HIGH' : 'MEDIUM',
    message,
    userId,
    ip,
    metadata,
  });
};

/**
 * Log webhook security event
 */
export const logWebhookEvent = (
  type: SecurityEventType,
  message: string,
  ip?: string,
  metadata?: Record<string, any>
) => {
  logSecurityEvent({
    type,
    severity: type.includes('TAMPERING') || type.includes('MISMATCH') ? 'CRITICAL' : 'HIGH',
    message,
    ip,
    metadata,
  });
};

/**
 * Log rate limit breach
 */
export const logRateLimitEvent = (
  endpoint: string,
  ip: string,
  userId?: string
) => {
  logSecurityEvent({
    type: SecurityEventType.RATE_LIMIT_EXCEEDED,
    severity: 'MEDIUM',
    message: `Rate limit exceeded for endpoint: ${endpoint}`,
    ip,
    userId,
    endpoint,
  });
};

/**
 * Log payment security event
 */
export const logPaymentEvent = (
  type: SecurityEventType,
  message: string,
  userId?: string,
  ip?: string,
  metadata?: Record<string, any>
) => {
  logSecurityEvent({
    type,
    severity: 'CRITICAL',
    message,
    userId,
    ip,
    metadata,
  });
};

/**
 * Log CORS violation
 */
export const logCorsViolation = (
  origin: string,
  ip: string
) => {
  logSecurityEvent({
    type: SecurityEventType.CORS_VIOLATION,
    severity: 'MEDIUM',
    message: `CORS violation - unauthorized origin: ${origin}`,
    ip,
    metadata: { origin },
  });
};

/**
 * Log file upload security event
 */
export const logUploadEvent = (
  type: SecurityEventType,
  message: string,
  userId?: string,
  ip?: string,
  metadata?: Record<string, any>
) => {
  logSecurityEvent({
    type,
    severity: type.includes('MALICIOUS') ? 'CRITICAL' : 'HIGH',
    message,
    userId,
    ip,
    metadata,
  });
};
