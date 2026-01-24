"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORAGE_BUCKET = void 0;
exports.getSupabaseAdmin = getSupabaseAdmin;
exports.uploadToStorage = uploadToStorage;
exports.testStorageConnection = testStorageConnection;
exports.deleteFromStorage = deleteFromStorage;
exports.isStorageConfigured = isStorageConfigured;
const supabase_js_1 = require("@supabase/supabase-js");
// Storage bucket name for product images
exports.STORAGE_BUCKET = 'product-images';
let supabaseAdmin = null;
/**
 * Get environment variables at runtime (after dotenv.config() has run)
 */
function getSupabaseEnv() {
    return {
        url: process.env.SUPABASE_URL,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
}
/**
 * Validate Supabase configuration and log diagnostic info
 */
function validateSupabaseConfig() {
    const { url, serviceRoleKey } = getSupabaseEnv();
    const errors = [];
    if (!url) {
        errors.push('SUPABASE_URL is not set in environment variables');
    }
    else if (!url.includes('supabase.co')) {
        errors.push(`SUPABASE_URL appears invalid: ${url}`);
    }
    if (!serviceRoleKey) {
        errors.push('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
    }
    else if (serviceRoleKey === 'your-supabase-service-role-key' ||
        serviceRoleKey.length < 100) {
        errors.push('SUPABASE_SERVICE_ROLE_KEY appears to be a placeholder or invalid');
    }
    return { valid: errors.length === 0, errors };
}
/**
 * Get Supabase admin client with service role key
 * Used for server-side operations like file uploads
 * Service role key BYPASSES Row Level Security (RLS) - use carefully!
 */
function getSupabaseAdmin() {
    const validation = validateSupabaseConfig();
    const { url, serviceRoleKey } = getSupabaseEnv();
    if (!validation.valid) {
        console.error('[Supabase Config] ❌ CONFIGURATION ERRORS:', validation.errors);
        throw new Error(`Supabase configuration invalid:\n${validation.errors.join('\n')}\n\nPlease update backend/.env with correct values from Supabase Dashboard > Project Settings > API`);
    }
    if (!supabaseAdmin) {
        console.log('[Supabase Config] ✅ Initializing Supabase admin client...', {
            url: url,
            hasServiceKey: !!serviceRoleKey,
            keyLength: serviceRoleKey?.length,
        });
        supabaseAdmin = (0, supabase_js_1.createClient)(url, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
        console.log('[Supabase Config] ✅ Admin client initialized successfully');
    }
    return supabaseAdmin;
}
/**
 * Upload file to Supabase Storage
 * @param file - File buffer
 * @param fileName - Name to save the file as
 * @param contentType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
async function uploadToStorage(file, fileName, contentType) {
    console.log('[Supabase Storage] 📤 Starting upload...', {
        fileName,
        contentType,
        fileSize: file.length,
        bucket: exports.STORAGE_BUCKET,
    });
    const supabase = getSupabaseAdmin();
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;
    // Sanitize filename - remove special chars that might cause issues
    const sanitizedFileName = uniqueFileName
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .substring(0, 255);
    try {
        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
            .from(exports.STORAGE_BUCKET)
            .upload(sanitizedFileName, file, {
            contentType,
            cacheControl: '3600',
        });
        if (uploadError) {
            console.error('[Supabase Storage] ❌ Upload failed:', uploadError);
            throw new Error(`Failed to upload file: ${uploadError.message}`);
        }
        console.log('[Supabase Storage] ✅ Upload successful:', {
            path: data.path,
            fileName: sanitizedFileName,
        });
        // ✅ CRITICAL: Generate public URL and VERIFY it's accessible
        const { data: publicUrlData } = supabase.storage
            .from(exports.STORAGE_BUCKET)
            .getPublicUrl(data.path);
        const publicUrl = publicUrlData.publicUrl;
        console.log('[Supabase Storage] 🔗 Generated public URL:', publicUrl);
        // Verify public URL is accessible by checking bucket RLS
        // (This is informational - actual permission checking happens in Supabase)
        console.log('[Supabase Storage] ℹ️ Bucket must have public read access for:', {
            bucket: exports.STORAGE_BUCKET,
            publicUrl,
            note: 'Configure in Supabase Dashboard > Storage > product-images > Policies',
        });
        return publicUrl;
    }
    catch (error) {
        console.error('[Supabase Storage] 🔴 STORAGE ERROR:', error);
        throw error;
    }
}
/**
 * Test if storage is properly configured
 */
async function testStorageConnection() {
    try {
        const supabase = getSupabaseAdmin();
        console.log('[Supabase Storage] 🧪 Testing storage connection...');
        // Try to list files in bucket
        const { data, error } = await supabase.storage
            .from(exports.STORAGE_BUCKET)
            .list('', { limit: 1 });
        if (error) {
            console.error('[Supabase Storage] ❌ Connection test failed:', error);
            return { success: false, error: error.message };
        }
        console.log('[Supabase Storage] ✅ Connection test successful');
        return { success: true };
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[Supabase Storage] ❌ Connection test error:', errorMsg);
        return { success: false, error: errorMsg };
    }
}
/**
 * Delete file from Supabase Storage
 * @param fileName - Name of the file to delete
 */
async function deleteFromStorage(fileName) {
    console.log('[Supabase Storage] 🗑️ Starting delete...', {
        fileName,
        bucket: exports.STORAGE_BUCKET,
    });
    const supabase = getSupabaseAdmin();
    try {
        const { error: deleteError } = await supabase.storage
            .from(exports.STORAGE_BUCKET)
            .remove([fileName]);
        if (deleteError) {
            console.error('[Supabase Storage] ❌ Delete failed:', deleteError);
            throw new Error(`Failed to delete file: ${deleteError.message}`);
        }
        console.log('[Supabase Storage] ✅ Delete successful:', {
            fileName,
        });
    }
    catch (error) {
        console.error('[Supabase Storage] 🔴 DELETE ERROR:', error);
        throw error;
    }
}
/**
 * Check if storage is configured
 */
function isStorageConfigured() {
    const { url, serviceRoleKey } = getSupabaseEnv();
    return !!url && !!serviceRoleKey;
}
//# sourceMappingURL=supabase.js.map