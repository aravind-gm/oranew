/**
 * Security Event Logger
 * Structured logging for security-critical events
 * Prepare for future integration with SIEM systems
 */
export declare enum SecurityEventType {
    TOKEN_ABUSE = "TOKEN_ABUSE",
    INVALID_TOKEN = "INVALID_TOKEN",
    EXPIRED_TOKEN = "EXPIRED_TOKEN",
    TOKEN_ROTATION_FAILED = "TOKEN_ROTATION_FAILED",
    WEBHOOK_SIGNATURE_FAILED = "WEBHOOK_SIGNATURE_FAILED",
    WEBHOOK_AMOUNT_MISMATCH = "WEBHOOK_AMOUNT_MISMATCH",
    WEBHOOK_DUPLICATE = "WEBHOOK_DUPLICATE",
    WEBHOOK_MISSING_SIGNATURE = "WEBHOOK_MISSING_SIGNATURE",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
    PAYMENT_TAMPERING = "PAYMENT_TAMPERING",
    INVALID_PAYMENT_SIGNATURE = "INVALID_PAYMENT_SIGNATURE",
    REFUND_VIOLATION = "REFUND_VIOLATION",
    STOCK_MANIPULATION = "STOCK_MANIPULATION",
    NEGATIVE_STOCK_ATTEMPT = "NEGATIVE_STOCK_ATTEMPT",
    UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
    ADMIN_ACCESS_DENIED = "ADMIN_ACCESS_DENIED",
    CORS_VIOLATION = "CORS_VIOLATION",
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
    FILE_SIZE_EXCEEDED = "FILE_SIZE_EXCEEDED",
    MALICIOUS_UPLOAD_ATTEMPT = "MALICIOUS_UPLOAD_ATTEMPT"
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
export declare const logSecurityEvent: (event: Omit<SecurityEvent, "timestamp">) => void;
/**
 * Log authentication security event
 */
export declare const logAuthEvent: (type: SecurityEventType, message: string, userId?: string, ip?: string, metadata?: Record<string, any>) => void;
/**
 * Log webhook security event
 */
export declare const logWebhookEvent: (type: SecurityEventType, message: string, ip?: string, metadata?: Record<string, any>) => void;
/**
 * Log rate limit breach
 */
export declare const logRateLimitEvent: (endpoint: string, ip: string, userId?: string) => void;
/**
 * Log payment security event
 */
export declare const logPaymentEvent: (type: SecurityEventType, message: string, userId?: string, ip?: string, metadata?: Record<string, any>) => void;
/**
 * Log CORS violation
 */
export declare const logCorsViolation: (origin: string, ip: string) => void;
/**
 * Log file upload security event
 */
export declare const logUploadEvent: (type: SecurityEventType, message: string, userId?: string, ip?: string, metadata?: Record<string, any>) => void;
//# sourceMappingURL=securityLogger.d.ts.map