import { createClient } from '@supabase/supabase-js';

// Service role client - hanya untuk server-side/admin operations
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Ambil dari env
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);