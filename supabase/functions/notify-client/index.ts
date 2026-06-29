// ============================================================================
//  Edge Function: notify-client
//  Emails a client (via Resend) when the admin team shares a file with them.
//  Invoked from the admin portal: sb.functions.invoke('notify-client', {...})
//
//  Required Supabase secrets (set in dashboard → Edge Functions → Secrets):
//    RESEND_API_KEY      your Resend API key  (re_...)
//    EMAIL_FROM          e.g. "Magnum CPA <noreply@yourdomain.com>"  (verified in Resend)
//  (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are provided automatically.)
// ============================================================================
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
const ANON          = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const EMAIL_FROM    = Deno.env.get("EMAIL_FROM") || "Magnum CPA <onboarding@resend.dev>";
const PORTAL_URL    = "https://glendley.github.io/Test_MagnumCPA_Website_2.3_Single-Page/client-portal.html";
const ADMIN_EMAIL   = "ask@magnumcpa.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });
const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // 1. Verify the caller is an admin (uses their JWT from the browser).
    const authHeader = req.headers.get("Authorization") || "";
    const asUser = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: ures } = await asUser.auth.getUser();
    if (!ures?.user) return json({ error: "Not authenticated" }, 401);
    const { data: caller } = await asUser.from("profiles").select("role,email").eq("id", ures.user.id).maybeSingle();
    const isAdmin = caller && (caller.role === "admin" || (caller.email || "").toLowerCase() === ADMIN_EMAIL);
    if (!isAdmin) return json({ error: "Not authorized" }, 403);

    const { user_id, file_name, note } = await req.json();
    if (!user_id) return json({ error: "user_id required" }, 400);

    // 2. Look up the client's email with the service role.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: p } = await admin.from("profiles").select("email,name,full_name").eq("id", user_id).maybeSingle();
    const to = p?.email;
    if (!to) return json({ error: "Client email not found" }, 404);
    const name = p?.full_name || p?.name || "there";

    // 3. Send the email via Resend.
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#243a52;max-width:560px;">
        <h2 style="color:#243a52;">📎 A new file is waiting in your portal</h2>
        <p>Hi ${esc(name)},</p>
        <p>Magnum CPA just shared a file with you${file_name ? `: <b>${esc(file_name)}</b>` : ""}.</p>
        ${note ? `<p style="background:#f4f6f8;padding:10px 14px;border-radius:8px;"><b>Note from our team:</b> ${esc(note)}</p>` : ""}
        <p style="margin:22px 0;">
          <a href="${PORTAL_URL}" style="background:#f4a93c;color:#1c2e41;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold;">Open your portal</a>
        </p>
        <p style="color:#5e6b78;font-size:13px;">Magnum CPA PC · Certified Public Accountant</p>
      </div>`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: EMAIL_FROM, to,
        subject: "A new file is waiting in your Magnum CPA portal",
        html,
      }),
    });
    if (!r.ok) return json({ error: "Email send failed", detail: await r.text() }, 502);
    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
