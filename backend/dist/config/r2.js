"use strict";
/**
 * Cloudflare R2 Storage Service
 * Production-grade image upload service for ORA Jewellery
 *
 * Architecture:
 * - Backend ONLY handles uploads (no frontend uploads)
 * - All images served via Cloudflare CDN
 * - Automatic WebP conversion
 * - Multi-variant image generation (thumb, listing, hero, zoom)
 * - Secure private write access
 *
 * @author ORA Engineering
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IMAGE_VARIANTS = void 0;
exports.isR2Configured = isR2Configured;
exports.getR2Client = getR2Client;
exports.getCurrentR2Config = getCurrentR2Config;
exports.sanitizeFilename = sanitizeFilename;
exports.generateProductImagePath = generateProductImagePath;
exports.generateCollectionImagePath = generateCollectionImagePath;
exports.generateBannerImagePath = generateBannerImagePath;
exports.generateBrandAssetPath = generateBrandAssetPath;
exports.getCdnUrl = getCdnUrl;
exports.validateImageFile = validateImageFile;
exports.uploadToR2 = uploadToR2;
exports.deleteFromR2 = deleteFromR2;
exports.fileExistsInR2 = fileExistsInR2;
exports.deleteProductImages = deleteProductImages;
exports.testR2Connection = testR2Connection;
const client_s3_1 = require("@aws-sdk/client-s3");
const crypto_1 = __importDefault(require("crypto"));
// ============================================
// CONSTANTS
// ============================================
exports.IMAGE_VARIANTS = [
    { role: 'thumbnail', width: 300, quality: 80 },
    { role: 'listing', width: 600, quality: 85 },
    { role: 'hero', width: 1200, quality: 90 },
    { role: 'zoom', width: 2400, quality: 95 },
];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
// ============================================
// R2 CLIENT SINGLETON
// ============================================
let r2Client = null;
let r2Config = null;
/**
 * Get R2 configuration from environment variables
 */
function getR2Config() {
    const config = {
        accountId: process.env.R2_ACCOUNT_ID || '',
        accessKeyId: process.env.R2_ACCESS_KEY || '',
        secretAccessKey: process.env.R2_SECRET_KEY || '',
        bucketName: process.env.R2_BUCKET || 'ora-images',
        publicBaseUrl: process.env.R2_PUBLIC_BASE_URL || '',
    };
    return config;
}
/**
 * Validate R2 configuration
 */
function validateR2Config(config) {
    const errors = [];
    if (!config.accountId) {
        errors.push('R2_ACCOUNT_ID is not set');
    }
    if (!config.accessKeyId) {
        errors.push('R2_ACCESS_KEY is not set');
    }
    if (!config.secretAccessKey) {
        errors.push('R2_SECRET_KEY is not set');
    }
    if (!config.bucketName) {
        errors.push('R2_BUCKET is not set');
    }
    if (!config.publicBaseUrl) {
        errors.push('R2_PUBLIC_BASE_URL is not set (should be CDN URL like https://cdn.orashop.in)');
    }
    return { valid: errors.length === 0, errors };
}
/**
 * Check if R2 is properly configured
 */
function isR2Configured() {
    const config = getR2Config();
    const validation = validateR2Config(config);
    return validation.valid;
}
/**
 * Get or create R2 S3-compatible client
 */
function getR2Client() {
    if (r2Client && r2Config) {
        return r2Client;
    }
    const config = getR2Config();
    const validation = validateR2Config(config);
    if (!validation.valid) {
        console.error('[R2 Storage] ❌ CONFIGURATION ERRORS:', validation.errors);
        throw new Error(`R2 configuration invalid:\n${validation.errors.join('\n')}\n\nPlease update backend/.env with correct R2 values from Cloudflare Dashboard`);
    }
    console.log('[R2 Storage] ✅ Initializing R2 client...', {
        accountId: config.accountId.substring(0, 8) + '...',
        bucket: config.bucketName,
        cdnUrl: config.publicBaseUrl,
    });
    // R2 uses S3-compatible API
    r2Client = new client_s3_1.S3Client({
        region: 'auto',
        endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });
    r2Config = config;
    console.log('[R2 Storage] ✅ R2 client initialized successfully');
    return r2Client;
}
/**
 * Get current R2 config (after initialization)
 */
function getCurrentR2Config() {
    if (!r2Config) {
        getR2Client(); // Initialize if needed
    }
    return r2Config;
}
// ============================================
// FILE PATH UTILITIES
// ============================================
/**
 * Sanitize filename - remove special characters
 */
function sanitizeFilename(filename) {
    return filename
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 100);
}
/**
 * Generate deterministic path for product images
 * Format: products/{productId}/{variant}.webp
 */
function generateProductImagePath(productId, variant) {
    return `products/${productId}/${variant}.webp`;
}
/**
 * Generate path for collection images
 * Format: collections/{collectionSlug}/hero.webp
 */
function generateCollectionImagePath(collectionSlug, variant = 'hero') {
    const sanitizedSlug = sanitizeFilename(collectionSlug);
    return `collections/${sanitizedSlug}/${variant}.webp`;
}
/**
 * Generate path for banner images
 * Format: banners/{page}/{uniqueId}.webp
 */
function generateBannerImagePath(page, uniqueId) {
    const id = uniqueId || crypto_1.default.randomUUID().substring(0, 8);
    return `banners/${page}/${id}.webp`;
}
/**
 * Generate path for brand assets
 * Format: brand/{assetType}.webp
 */
function generateBrandAssetPath(assetType) {
    return `brand/${assetType}.webp`;
}
/**
 * Get public CDN URL from R2 path
 */
function getCdnUrl(path) {
    const config = getCurrentR2Config();
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${config.publicBaseUrl}/${cleanPath}`;
}
// ============================================
// FILE VALIDATION
// ============================================
/**
 * Validate uploaded file
 */
function validateImageFile(buffer, mimeType, originalName) {
    // Check file size
    if (buffer.length > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File size (${(buffer.length / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed (2MB)`,
        };
    }
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return {
            valid: false,
            error: `File type '${mimeType}' is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
        };
    }
    // Validate magic bytes (file signature)
    const validSignature = validateFileSignature(buffer, mimeType);
    if (!validSignature) {
        return {
            valid: false,
            error: 'File content does not match declared type (possible file spoofing)',
        };
    }
    return { valid: true };
}
/**
 * Validate file magic bytes
 */
function validateFileSignature(buffer, mimeType) {
    if (buffer.length < 8)
        return false;
    const signatures = {
        'image/jpeg': [[0xff, 0xd8, 0xff]],
        'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
        'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
        'image/gif': [[0x47, 0x49, 0x46, 0x38]], // GIF8
    };
    const expectedSignatures = signatures[mimeType];
    if (!expectedSignatures)
        return true; // Unknown type, allow
    return expectedSignatures.some((sig) => sig.every((byte, index) => buffer[index] === byte));
}
// ============================================
// UPLOAD OPERATIONS
// ============================================
/**
 * Upload a single file to R2
 */
async function uploadToR2(buffer, path, contentType = 'image/webp') {
    const client = getR2Client();
    const config = getCurrentR2Config();
    console.log('[R2 Storage] 📤 Uploading file...', {
        path,
        size: buffer.length,
        contentType,
        bucket: config.bucketName,
    });
    try {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: config.bucketName,
            Key: path,
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000, immutable', // 1 year cache
            Metadata: {
                'uploaded-at': new Date().toISOString(),
                'source': 'ora-backend',
            },
        });
        await client.send(command);
        const url = getCdnUrl(path);
        console.log('[R2 Storage] ✅ Upload successful:', {
            path,
            url,
            size: buffer.length,
        });
        return {
            success: true,
            url,
            path,
            variant: path.split('/').pop()?.replace('.webp', '') || 'unknown',
            size: buffer.length,
        };
    }
    catch (error) {
        console.error('[R2 Storage] ❌ Upload failed:', {
            path,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}
/**
 * Delete a file from R2
 */
async function deleteFromR2(path) {
    const client = getR2Client();
    const config = getCurrentR2Config();
    console.log('[R2 Storage] 🗑️ Deleting file...', { path });
    try {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: config.bucketName,
            Key: path,
        });
        await client.send(command);
        console.log('[R2 Storage] ✅ Delete successful:', { path });
        return true;
    }
    catch (error) {
        console.error('[R2 Storage] ❌ Delete failed:', {
            path,
            error: error instanceof Error ? error.message : String(error),
        });
        return false;
    }
}
/**
 * Check if a file exists in R2
 */
async function fileExistsInR2(path) {
    const client = getR2Client();
    const config = getCurrentR2Config();
    try {
        const command = new client_s3_1.HeadObjectCommand({
            Bucket: config.bucketName,
            Key: path,
        });
        await client.send(command);
        return true;
    }
    catch (error) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            return false;
        }
        throw error;
    }
}
/**
 * Delete all images for a product
 */
async function deleteProductImages(productId) {
    const variants = ['thumbnail', 'listing', 'hero', 'zoom'];
    for (const variant of variants) {
        const path = generateProductImagePath(productId, variant);
        await deleteFromR2(path);
    }
}
// ============================================
// TEST CONNECTION
// ============================================
/**
 * Test R2 connection and configuration
 */
async function testR2Connection() {
    try {
        const client = getR2Client();
        const config = getCurrentR2Config();
        // Try to check if bucket is accessible by listing (limit 1)
        const { ListObjectsV2Command } = await Promise.resolve().then(() => __importStar(require('@aws-sdk/client-s3')));
        const command = new ListObjectsV2Command({
            Bucket: config.bucketName,
            MaxKeys: 1,
        });
        await client.send(command);
        console.log('[R2 Storage] ✅ Connection test successful');
        return { success: true };
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[R2 Storage] ❌ Connection test failed:', errorMsg);
        return { success: false, error: errorMsg };
    }
}
//# sourceMappingURL=r2.js.map