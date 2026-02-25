import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

type UpdateSessionResult = {
  response: NextResponse;
};

export async function updateSession(req: NextRequest): Promise<UpdateSessionResult> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase middleware env vars");
  }

  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: { [key: string]: unknown }) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: { [key: string]: unknown }) {
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const { error } = await supabase.auth.getSession();
  if (error) {
    return { response };
  }

  return { response };
}
