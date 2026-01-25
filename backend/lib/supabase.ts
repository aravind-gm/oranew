// backend/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client with anon key (for reading public data)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Client with service role key (for admin operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Utility to upload files to Supabase Storage
export async function uploadToSupabase(
  bucket: string,
  path: string,
  file: Buffer,
  contentType: string
) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: false,
    });

  if (error) throw error;

  // Return the public URL
  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);

  return publicUrl;
}

export default supabaseClient;
