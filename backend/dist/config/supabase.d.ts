import { SupabaseClient } from '@supabase/supabase-js';
export declare const STORAGE_BUCKET = "product-images";
/**
 * Get Supabase admin client with service role key
 * Used for server-side operations like file uploads
 * Service role key BYPASSES Row Level Security (RLS) - use carefully!
 */
export declare function getSupabaseAdmin(): SupabaseClient;
/**
 * Upload file to Supabase Storage
 * @param file - File buffer
 * @param fileName - Name to save the file as
 * @param contentType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
export declare function uploadToStorage(file: Buffer, fileName: string, contentType: string): Promise<string>;
/**
 * Test if storage is properly configured
 */
export declare function testStorageConnection(): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Delete file from Supabase Storage
 * @param fileName - Name of the file to delete
 */
export declare function deleteFromStorage(fileName: string): Promise<void>;
/**
 * Check if storage is configured
 */
export declare function isStorageConfigured(): boolean;
//# sourceMappingURL=supabase.d.ts.map