"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/lib/supabase/types";

type Supabase = SupabaseClient<Database>;

const SupabaseContext = createContext<Supabase | null>(null);

export function useSupabase() {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error("useSupabase must be used within SupabaseProvider.");
  }
  return client;
}

type SupabaseProviderProps = PropsWithChildren<{
  initialSession: Session | null;
}>;

export default function SupabaseProvider({ children, initialSession }: SupabaseProviderProps) {
  const [client] = useState(() => createSupabaseBrowserClient());

  useEffect(() => {
    if (initialSession) {
      void client.auth.setSession({
        access_token: initialSession.access_token,
        refresh_token: initialSession.refresh_token ?? "",
      });
    }
    // No else clause - let client manage its own auth state
  }, [client, initialSession]);

  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>;
}
