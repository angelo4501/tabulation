type PublicSupabaseEnv = {
  appUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export function getPublicSupabaseEnv(): PublicSupabaseEnv | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!appUrl || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return {
    appUrl,
    supabaseUrl,
    supabaseAnonKey
  };
}

export function requirePublicSupabaseEnv() {
  const env = getPublicSupabaseEnv();
  if (!env) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return env;
}

export function requireServiceRoleKey() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured on the server.");
  }

  return serviceRoleKey;
}
