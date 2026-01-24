"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rawBodyParser = void 0;
/**
 * Middleware to capture raw request body for webhook signature verification
 *
 * This middleware MUST be used BEFORE json() middleware for webhook routes
 * because Razorpay signature verification requires the exact original request body
 *
 * Usage:
 * app.post('/api/payments/webhook', rawBodyParser, paymentController.webhook);
 */
const rawBodyParser = (req, res, next) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
        data += chunk;
    });
    req.on('end', () => {
        // Store raw body for signature verification
        req.rawBody = data;
        // Try to parse as JSON for further middleware
        try {
            req.body = JSON.parse(data);
        }
        catch (error) {
            req.body = {};
        }
        next();
    });
};
exports.rawBodyParser = rawBodyParser;
exports.default = exports.rawBodyParser;
//# sourceMappingURL=rawBodyParser.js.map