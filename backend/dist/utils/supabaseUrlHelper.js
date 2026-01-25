"use strict";
/**
 * Supabase URL normalization utility
 * Ensures image URLs from Supabase are in the correct public format
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSupabaseUrl = normalizeSupabaseUrl;
function normalizeSupabaseUrl(imageUrl) {
    if (!imageUrl) {
        return null;
    }
    // If it's not a Supabase URL, return as-is
    if (!imageUrl.includes('supabase.co')) {
        return imageUrl;
    }
    // If it's already a proper public URL, return as-is
    if (imageUrl.includes('/storage/v1/object/public/')) {
        return imageUrl;
    }
    // If it has /storage/v1/object/ but missing /public/, fix it
    if (imageUrl.includes('/storage/v1/object/')) {
        return imageUrl.replace('/storage/v1/object/', '/storage/v1/object/public/');
    }
    // If it's in the old format or missing parts, reconstruct it
    // Extract project ID and path
    const projectMatch = imageUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
    const pathMatch = imageUrl.match(/product-images\/(.+)$/);
    if (projectMatch && pathMatch) {
        const projectId = projectMatch[1];
        const filePath = pathMatch[1];
        return `https://${projectId}.supabase.co/storage/v1/object/public/product-images/${filePath}`;
    }
    // If we can't parse it, return as-is
    return imageUrl;
}
//# sourceMappingURL=supabaseUrlHelper.js.map