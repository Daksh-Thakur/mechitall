import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase client environment variables are missing. Returning proxy fallback to prevent SSR crash.");
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
  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      }
    }
  );
};
