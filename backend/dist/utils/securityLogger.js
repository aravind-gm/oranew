"use strict";
/**
 * Security Event Logger
 * Structured logging for security-critical events
 * Prepare for future integration with SIEM systems
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logUploadEvent = exports.logCorsViolation = exports.logPaymentEvent = exports.logRateLimitEvent = exports.logWebhookEvent = exports.logAuthEvent = exports.logSecurityEvent = exports.SecurityEventType = void 0;
var SecurityEventType;
(function (SecurityEventType) {
    // Authentication Events
    SecurityEventType["TOKEN_ABUSE"] = "TOKEN_ABUSE";
    SecurityEventType["INVALID_TOKEN"] = "INVALID_TOKEN";
    SecurityEventType["EXPIRED_TOKEN"] = "EXPIRED_TOKEN";
    SecurityEventType["TOKEN_ROTATION_FAILED"] = "TOKEN_ROTATION_FAILED";
    // Webhook Events
    SecurityEventType["WEBHOOK_SIGNATURE_FAILED"] = "WEBHOOK_SIGNATURE_FAILED";
    SecurityEventType["WEBHOOK_AMOUNT_MISMATCH"] = "WEBHOOK_AMOUNT_MISMATCH";
    SecurityEventType["WEBHOOK_DUPLICATE"] = "WEBHOOK_DUPLICATE";
    SecurityEventType["WEBHOOK_MISSING_SIGNATURE"] = "WEBHOOK_MISSING_SIGNATURE";
    // Rate Limiting Events
    SecurityEventType["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    SecurityEventType["SUSPICIOUS_ACTIVITY"] = "SUSPICIOUS_ACTIVITY";
    // Payment Security
    SecurityEventType["PAYMENT_TAMPERING"] = "PAYMENT_TAMPERING";
    SecurityEventType["INVALID_PAYMENT_SIGNATURE"] = "INVALID_PAYMENT_SIGNATURE";
    SecurityEventType["REFUND_VIOLATION"] = "REFUND_VIOLATION";
    // Inventory Security
    SecurityEventType["STOCK_MANIPULATION"] = "STOCK_MANIPULATION";
    SecurityEventType["NEGATIVE_STOCK_ATTEMPT"] = "NEGATIVE_STOCK_ATTEMPT";
    // Access Control
    SecurityEventType["UNAUTHORIZED_ACCESS"] = "UNAUTHORIZED_ACCESS";
    SecurityEventType["ADMIN_ACCESS_DENIED"] = "ADMIN_ACCESS_DENIED";
    SecurityEventType["CORS_VIOLATION"] = "CORS_VIOLATION";
    // Upload Security
    SecurityEventType["INVALID_FILE_TYPE"] = "INVALID_FILE_TYPE";
    SecurityEventType["FILE_SIZE_EXCEEDED"] = "FILE_SIZE_EXCEEDED";
    SecurityEventType["MALICIOUS_UPLOAD_ATTEMPT"] = "MALICIOUS_UPLOAD_ATTEMPT";
})(SecurityEventType || (exports.SecurityEventType = SecurityEventType = {}));
/**
 * Log security event with structured format
 * In production, this should send to monitoring system (DataDog, Sentry, etc.)
 */
const logSecurityEvent = (event) => {
    const fullEvent = {
        ...event,
        timestamp: new Date().toISOString(),
    };
    // Color-coded console output for visibility
    const severityColors = {
        LOW: '\x1b[32m', // Green
        MEDIUM: '\x1b[33m', // Yellow
        HIGH: '\x1b[31m', // Red
        CRITICAL: '\x1b[35m', // Magenta
    };
    const color = severityColors[event.severity] || '\x1b[0m';
    const reset = '\x1b[0m';
    console.warn(`${color}[SECURITY:${event.severity}]${reset}`, event.type, JSON.stringify({
        message: event.message,
        ip: event.ip,
        userId: event.userId,
        endpoint: event.endpoint,
        metadata: event.metadata,
        timestamp: fullEvent.timestamp,
    }, null, 2));
    // TODO: Send to monitoring system in production
    // Examples:
    // - await datadogLogger.log(fullEvent);
    // - await sentryLogger.captureEvent(fullEvent);
    // - await elasticsearchClient.index({ index: 'security-events', body: fullEvent });
};
exports.logSecurityEvent = logSecurityEvent;
/**
 * Log authentication security event
 */
const logAuthEvent = (type, message, userId, ip, metadata) => {
    (0, exports.logSecurityEvent)({
        type,
        severity: type.includes('ABUSE') || type.includes('FAILED') ? 'HIGH' : 'MEDIUM',
        message,
        userId,
        ip,
        metadata,
    });
};
exports.logAuthEvent = logAuthEvent;
/**
 * Log webhook security event
 */
const logWebhookEvent = (type, message, ip, metadata) => {
    (0, exports.logSecurityEvent)({
        type,
        severity: type.includes('TAMPERING') || type.includes('MISMATCH') ? 'CRITICAL' : 'HIGH',
        message,
        ip,
        metadata,
    });
};
exports.logWebhookEvent = logWebhookEvent;
/**
 * Log rate limit breach
 */
const logRateLimitEvent = (endpoint, ip, userId) => {
    (0, exports.logSecurityEvent)({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: 'MEDIUM',
        message: `Rate limit exceeded for endpoint: ${endpoint}`,
        ip,
        userId,
        endpoint,
    });
};
exports.logRateLimitEvent = logRateLimitEvent;
/**
 * Log payment security event
 */
const logPaymentEvent = (type, message, userId, ip, metadata) => {
    (0, exports.logSecurityEvent)({
        type,
        severity: 'CRITICAL',
        message,
        userId,
        ip,
        metadata,
    });
};
exports.logPaymentEvent = logPaymentEvent;
/**
 * Log CORS violation
 */
const logCorsViolation = (origin, ip) => {
    (0, exports.logSecurityEvent)({
        type: SecurityEventType.CORS_VIOLATION,
        severity: 'MEDIUM',
        message: `CORS violation - unauthorized origin: ${origin}`,
        ip,
        metadata: { origin },
    });
};
exports.logCorsViolation = logCorsViolation;
/**
 * Log file upload security event
 */
const logUploadEvent = (type, message, userId, ip, metadata) => {
    (0, exports.logSecurityEvent)({
        type,
        severity: type.includes('MALICIOUS') ? 'CRITICAL' : 'HIGH',
        message,
        userId,
        ip,
        metadata,
    });
};
exports.logUploadEvent = logUploadEvent;
//# sourceMappingURL=securityLogger.js.map