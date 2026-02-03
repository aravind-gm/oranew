-- Add supabaseId field to users table
ALTER TABLE "users" ADD COLUMN "supabase_id" TEXT;

-- Create unique constraint on supabase_id
CREATE UNIQUE INDEX "users_supabase_id_key" ON "users"("supabase_id");
