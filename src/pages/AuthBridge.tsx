import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Cross-subdomain auth bridge.
 * Lives on the main domain (staticvibes.site).
 * Usage: navigate to /auth-bridge?return=https://admin.staticvibes.site/
 *
 * Flow:
 *  1. Validate that `return` is a *.staticvibes.site URL.
 *  2. If the user has a session on the main domain, append the access + refresh
 *     tokens to the return URL via hash params and redirect.
 *  3. If not logged in, send the user to /auth with a redirect back to this bridge.
 */
const ALLOWED_HOST_SUFFIX = ".staticvibes.site";
const ALLOWED_HOSTS = ["staticvibes.site", "www.staticvibes.site"];

const isAllowedReturn = (url: string) => {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const h = u.hostname.toLowerCase();
    return ALLOWED_HOSTS.includes(h) || h.endsWith(ALLOWED_HOST_SUFFIX);
  } catch {
    return false;
  }
};

const AuthBridge = () => {
  const [message, setMessage] = useState("Authenticating…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("return") || "";

    if (!returnTo || !isAllowedReturn(returnTo)) {
      setMessage("Invalid return URL.");
      setTimeout(() => window.location.replace("/"), 1500);
      return;
    }

    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        // Not logged in → bounce to /auth with a redirect back here.
        const here = `/auth-bridge?return=${encodeURIComponent(returnTo)}`;
        window.location.replace(`/auth?redirect=${encodeURIComponent(here)}`);
        return;
      }

      const url = new URL(returnTo);
      const hash = new URLSearchParams();
      hash.set("sv_access", session.access_token);
      hash.set("sv_refresh", session.refresh_token);
      url.hash = hash.toString();
      window.location.replace(url.toString());
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default AuthBridge;
