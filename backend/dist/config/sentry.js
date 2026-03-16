"use strict";
/**
 * Sentry — Production Error Monitoring
 *
 * Captures:
 *  - Uncaught exceptions
 *  - Unhandled promise rejections
 *  - HTTP request context (URL, method, user ID)
 *
 * Security guarantees:
 *  - Cookies stripped from all events
 *  - Authorization headers stripped
 *  - Token values never appear in Sentry
 *
 * Usage: call initSentry() once at the very top of server.ts, BEFORE any
 * other imports that might throw.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sentry = void 0;
exports.initSentry = initSentry;
exports.captureException = captureException;
exports.setSentryUser = setSentryUser;
exports.clearSentryUser = clearSentryUser;
const Sentry = __importStar(require("@sentry/node"));
exports.Sentry = Sentry;
let sentryInitialized = false;
function initSentry() {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) {
        if (process.env.NODE_ENV === 'production') {
            console.warn('[Sentry] ⚠️  SENTRY_DSN not set — error monitoring disabled');
        }
        return;
    }
    Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'development',
        // 10 % of transactions traced in production (enough for P95 tracking)
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        // Never send events in test environment
        enabled: process.env.NODE_ENV !== 'test',
        beforeSend(event) {
            // ── SECURITY: strip all cookie and auth header data ──
            if (event.request) {
                if (event.request.cookies) {
                    event.request.cookies = {};
                }
                if (event.request.headers) {
                    delete event.request.headers['authorization'];
                    delete event.request.headers['cookie'];
                    delete event.request.headers['set-cookie'];
                }
            }
            // Strip user email from breadcrumbs (keep only userId)
            if (event.user?.email) {
                delete event.user.email;
            }
            return event;
        },
    });
    sentryInitialized = true;
    console.log(`[Sentry] ✅ Error monitoring initialized (env: ${process.env.NODE_ENV})`);
}
/**
 * Capture an exception with optional extra context.
 * Safe to call even if Sentry was not initialized — it will be a no-op.
 */
function captureException(error, context) {
    if (!sentryInitialized)
        return;
    Sentry.withScope((scope) => {
        if (context) {
            scope.setExtras(context);
        }
        Sentry.captureException(error);
    });
}
/**
 * Set the authenticated user on the current Sentry scope.
 * Called from the auth middleware after token validation.
 * Only sets userId — never email or any PII beyond the opaque ID.
 */
function setSentryUser(userId, role) {
    if (!sentryInitialized)
        return;
    Sentry.setUser({ id: userId, role });
}
/**
 * Clear the Sentry user scope (call on logout / unauthenticated paths).
 */
function clearSentryUser() {
    if (!sentryInitialized)
        return;
    Sentry.setUser(null);
}
//# sourceMappingURL=sentry.js.map