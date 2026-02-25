import { createBrowserClient } from "@supabase/ssr";

export type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>;

type BrowserClientOptions = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

export function getBrowserSupabaseClient(
  options: BrowserClientOptions = {}
): SupabaseBrowserClient {
  const supabaseUrl = options.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    options.supabaseAnonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase browser env vars");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
