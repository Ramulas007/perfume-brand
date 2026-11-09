import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return j({ error: "Missing Authorization" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return j({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return j({ error: "Forbidden — admin only" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    async function listAllAuthUsers() {
      const out: any[] = [];
      let page = 1;
      while (true) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw error;
        out.push(...data.users);
        if (data.users.length < 200) break;
        page++;
        if (page > 25) break;
      }
      return out;
    }

    if (action === "list") {
      const users = await listAllAuthUsers();
      const { data: roles } = await admin.from("user_roles").select("user_id, role, created_at");
      const roleMap = new Map<string, { role: string; granted_at: string }>();
      (roles ?? []).forEach((r: any) => roleMap.set(r.user_id, { role: r.role, granted_at: r.created_at }));

      const admins: any[] = [];
      const customers: any[] = [];
      for (const u of users) {
        const r = roleMap.get(u.id);
        const entry = {
          id: u.id,
          email: u.email,
          phone: u.phone,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          full_name: u.user_metadata?.full_name ?? null,
          provider: u.app_metadata?.provider ?? "email",
          role: r?.role ?? null,
          role_granted_at: r?.granted_at ?? null,
        };
        if (r?.role === "admin") admins.push(entry);
        else customers.push(entry);
      }
      return j({ admins, customers });
    }

    if (action === "add_admin") {
      const email = (body.email as string ?? "").trim().toLowerCase();
      if (!email) return j({ error: "email required" }, 400);

      const users = await listAllAuthUsers();
      const target = users.find((u) => (u.email ?? "").toLowerCase() === email);
      if (!target) return j({ error: "User with this email not found. Ask them to sign up first." }, 404);

      const { error: insErr } = await admin
        .from("user_roles")
        .insert({ user_id: target.id, role: "admin" });
      if (insErr && !`${insErr.message}`.toLowerCase().includes("duplicate")) {
        return j({ error: insErr.message }, 400);
      }
      return j({ success: true, user_id: target.id });
    }

    if (action === "remove_admin") {
      const userId = body.user_id as string;
      if (!userId) return j({ error: "user_id required" }, 400);
      if (userId === userData.user.id) return j({ error: "You cannot remove yourself" }, 400);
      const { error } = await admin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");
      if (error) return j({ error: error.message }, 400);
      return j({ success: true });
    }

    return j({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("admin-users error:", e);
    return j({ error: (e as Error).message }, 500);
  }
});
