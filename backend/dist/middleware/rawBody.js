"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rawBodyMiddleware = void 0;
/**
 * Middleware to capture raw body for webhook signature verification
 * MUST be before any body parsing middleware
 */
// Not needed if using express.raw() in server.ts, but kept for reference or if you want to use custom raw body capture
const rawBodyMiddleware = (req, res, next) => {
    if (req.originalUrl === '/api/payments/webhook') {
        let data = [];
        req.on('data', chunk => data.push(chunk));
        req.on('end', () => {
            req.rawBody = Buffer.concat(data);
            next();
        });
        req.on('error', () => {
            console.error('[RawBody] Stream error');
            next();
        });
    }
    else {
        next();
    }
};
exports.rawBodyMiddleware = rawBodyMiddleware;
//# sourceMappingURL=rawBody.js.map