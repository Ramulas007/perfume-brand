import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Sits at the root of a subdomain (e.g. admin.staticvibes.site).
 * On mount:
 *  - If the URL hash contains sv_access + sv_refresh (from /auth-bridge),
 *    call supabase.auth.setSession() and strip the hash.
 *  - Otherwise, if no session exists, redirect to the main domain's
 *    /auth-bridge with the current URL as the return target.
 *  - When a session is present, render children.
 */
export const SubdomainAuthGate = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const consumeHashTokens = async (): Promise<boolean> => {
      if (!window.location.hash) return false;
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const access = hash.get("sv_access");
      const refresh = hash.get("sv_refresh");
      if (!access || !refresh) return false;
      const { error } = await supabase.auth.setSession({
        access_token: access,
        refresh_token: refresh,
      });
      // Strip tokens from URL whether or not setSession failed.
      const cleanUrl = window.location.pathname + window.location.search;
      window.history.replaceState({}, "", cleanUrl);
      return !error;
    };

    (async () => {
      await consumeHashTokens();
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setReady(true);
        return;
      }
      // No session → bounce to main domain auth bridge.
      const returnTo = window.location.href;
      window.location.replace(
        `https://staticvibes.site/auth-bridge?return=${encodeURIComponent(returnTo)}`
      );
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
