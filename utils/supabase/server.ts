import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase server environment variables are missing. Returning proxy fallback to prevent SSR crash.");
    return new Proxy({}, {
      get(target, prop) {
        if (prop === 'auth') {
          return {
            getUser: async () => ({ data: { user: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signOut: async () => ({ error: null }),
          };
        }
        return () => ({
          select: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null })
            }),
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
              single: () => Promise.resolve({ data: null, error: null }),
            })
          }),
          from: function() { return this; }
        });
      }
    }) as any;
  }
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
      },
    },
  );
};
