"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORAGE_BUCKET = void 0;
exports.getSupabaseAdmin = getSupabaseAdmin;
exports.uploadToStorage = uploadToStorage;
exports.testStorageConnection = testStorageConnection;
exports.getSignedUrl = getSignedUrl;
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
        // ✅ CRITICAL: Generate public URL
        // Use Supabase SDK method, with manual fallback
        const { data: publicUrlData } = supabase.storage
            .from(exports.STORAGE_BUCKET)
            .getPublicUrl(data.path);
        let publicUrl = publicUrlData.publicUrl;
        // Fallback: Manually construct URL if SDK doesn't provide it
        if (!publicUrl || publicUrl.includes('undefined')) {
            const { url: supabaseUrl } = getSupabaseEnv();
            publicUrl = `${supabaseUrl}/storage/v1/object/public/${exports.STORAGE_BUCKET}/${data.path}`;
            console.warn('[Supabase Storage] ⚠️ SDK URL was empty, using manually constructed URL');
        }
        console.log('[Supabase Storage] 🔗 Generated public URL:', publicUrl);
        // Verify URL format
        console.log('[Supabase Storage] ℹ️ Bucket configuration:', {
            bucket: exports.STORAGE_BUCKET,
            fileSize: file.length,
            fileName: sanitizedFileName,
            publicUrl,
            note: 'Ensure Supabase Dashboard > Storage > product-images > Policies allows public SELECT',
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
 * Generate signed URL for private storage access
 * @param filePath - Path of the file in storage
 * @returns Signed URL that works for 1 hour
 */
async function getSignedUrl(filePath) {
    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.storage
            .from(exports.STORAGE_BUCKET)
            .createSignedUrl(filePath, 3600); // 1 hour expiry
        if (error) {
            console.error('[Supabase Storage] ❌ Signed URL generation failed:', error);
            throw new Error(`Failed to generate signed URL: ${error.message}`);
        }
        return data.signedUrl;
    }
    catch (error) {
        console.error('[Supabase Storage] 🔴 SIGNED URL ERROR:', error);
        throw error;
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