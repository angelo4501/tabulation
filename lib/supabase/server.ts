import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { requirePublicSupabaseEnv, requireServiceRoleKey } from "@/lib/env";

export async function createSupabaseServerClient() {
  const env = requirePublicSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies; route handlers and actions can.
        }
      }
    }
  });
}

export function createSupabaseAdminClient() {
  const env = requirePublicSupabaseEnv();
  return createClient(env.supabaseUrl, requireServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
