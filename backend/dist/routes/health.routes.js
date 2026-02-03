"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_controller_1 = require("../controllers/health.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public health check (simple)
// Used by Render to know when service is ready
router.get('/', health_controller_1.health);
// Detailed health check (requires auth)
// Used for admin diagnostics
router.get('/detailed', auth_1.protect, health_controller_1.healthDetailed);
exports.default = router;
//# sourceMappingURL=health.routes.js.map