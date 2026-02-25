import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export type SupabaseServerClient = ReturnType<typeof createServerClient>;

type ServerClientOptions = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

export function getServerSupabaseClient(
  options: ServerClientOptions = {}
): SupabaseServerClient {
  const supabaseUrl = options.supabaseUrl ?? process.env.SUPABASE_URL;
  const supabaseAnonKey = options.supabaseAnonKey ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase server env vars");
  }

  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: { [key: string]: unknown }) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (err) {
          // Ignore if called from a Server Component without response mutability.
        }
      },
      remove(name: string, options: { [key: string]: unknown }) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch (err) {
          // Ignore if called from a Server Component without response mutability.
        }
      },
    },
  });
}
