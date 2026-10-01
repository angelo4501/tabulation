"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requirePublicSupabaseEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const env = requirePublicSupabaseEnv();
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
