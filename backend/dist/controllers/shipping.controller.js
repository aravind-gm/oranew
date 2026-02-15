"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShippingConfig = void 0;
const shipping_1 = require("../utils/shipping");
/**
 * GET /api/shipping/rules
 * Public endpoint — returns current shipping configuration
 */
const getShippingConfig = async (_req, res, next) => {
    try {
        const rules = await (0, shipping_1.getShippingRules)();
        res.json({ success: true, data: rules });
    }
    catch (error) {
        next(error);
    }
};
exports.getShippingConfig = getShippingConfig;
//# sourceMappingURL=shipping.controller.js.map