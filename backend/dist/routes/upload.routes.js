"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const upload_controller_1 = require("../controllers/upload.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Configure multer for memory storage (files stored in buffer for upload to Supabase)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
        files: 10, // Max 10 files at once
    },
    fileFilter: (_req, file, cb) => {
        // Accept only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    },
});
// Upload multiple images (admin only)
router.post('/images', auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'), upload.array('images', 10), upload_controller_1.uploadImages);
// Delete an image (admin only)
router.delete('/images', auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'), upload_controller_1.deleteImage);
exports.default = router;
//# sourceMappingURL=upload.routes.js.map