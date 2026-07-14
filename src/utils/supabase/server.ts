import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { cookies } from "next/headers";

import { getPublicSupabaseEnv } from "@/lib/supabase/env";

export function createClient(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  const { publishableKey, url } = getPublicSupabaseEnv();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. The proxy refreshes them.
        }
      },
    },
  });
}
