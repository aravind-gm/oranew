"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.get('/addresses', user_controller_1.getAddresses);
router.post('/addresses', user_controller_1.createAddress);
router.put('/addresses/:id', user_controller_1.updateAddress);
router.delete('/addresses/:id', user_controller_1.deleteAddress);
exports.default = router;
//# sourceMappingURL=user.routes.js.map