// ============================================================================
//  Edge Function: asana-webhook
//  Receives Asana webhook events. When the "Filing" / "E-Filing" status of a
//  task changes, it posts an Account Update + notification to the matching
//  client in the portal (and can trigger the client email too).
//
//  Required Supabase secrets:
//    ASANA_PAT            Asana personal access token (to read task details)
//  Provided automatically: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
//  HOW CLIENTS ARE MATCHED (configure to your board):
//    This skeleton matches an Asana task to a portal client by a custom field
//    named "Client Email" on the task → profiles.email. Adjust CLIENT_EMAIL_FIELD
//    and the status fields below to match your Asana project.
// ============================================================================
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ASANA_PAT    = Deno.env.get("ASANA_PAT")!;

// ---- configure these to match your Asana board ----
const CLIENT_EMAIL_FIELD = "Client Email";        // custom field holding the client's portal email
const STATUS_FIELDS = ["Filing", "E-Filing", "Filing Status", "E-Filing Status"]; // fields we watch

const db = createClient(SUPABASE_URL, SERVICE_ROLE);

serve(async (req) => {
  // 1. Asana handshake: echo back the X-Hook-Secret on webhook creation.
  const hookSecret = req.headers.get("X-Hook-Secret");
  if (hookSecret) {
    await db.from("asana_webhooks").upsert({ id: "default", secret: hookSecret });
    return new Response("ok", { headers: { "X-Hook-Secret": hookSecret } });
  }

  // 2. Verify the signature on real events.
  const body = await req.text();
  const sig = req.headers.get("X-Hook-Signature") || "";
  const { data: cfg } = await db.from("asana_webhooks").select("secret").eq("id", "default").maybeSingle();
  if (cfg?.secret) {
    const ok = await verify(cfg.secret, body, sig);
    if (!ok) return new Response("bad signature", { status: 401 });
  }

  // 3. Process events — look at changed tasks.
  let events: any[] = [];
  try { events = JSON.parse(body).events || []; } catch { /* ignore */ }
  const taskIds = [...new Set(events.filter(e => e?.resource?.resource_type === "task").map(e => e.resource.gid))];

  for (const taskId of taskIds) {
    try {
      const task = await asanaGet(`/tasks/${taskId}?opt_fields=name,custom_fields,custom_fields.name,custom_fields.display_value,custom_fields.enum_value.name`);
      const fields: any[] = task?.data?.custom_fields || [];
      const emailField = fields.find(f => (f.name || "").toLowerCase() === CLIENT_EMAIL_FIELD.toLowerCase());
      const email = (emailField?.display_value || "").trim().toLowerCase();
      if (!email) continue;

      // find the portal client by email
      const { data: prof } = await db.from("profiles").select("id").ilike("email", email).maybeSingle();
      if (!prof?.id) continue;

      // build a status summary from the watched fields
      const statusBits = fields
        .filter(f => STATUS_FIELDS.some(s => s.toLowerCase() === (f.name || "").toLowerCase()))
        .map(f => `${f.name}: ${f.enum_value?.name || f.display_value || "—"}`);
      if (!statusBits.length) continue;

      const text = "📋 Status update: " + statusBits.join(" · ");
      await db.from("updates").insert({ user_id: prof.id, text });
      await db.from("notifications").insert({ user_id: prof.id, recipient: "client", text: "Your filing status was updated.", type: "update" });
    } catch (_e) { /* skip this task */ }
  }
  return new Response("ok");
});

async function asanaGet(path: string) {
  const r = await fetch("https://app.asana.com/api/1.0" + path, {
    headers: { "Authorization": `Bearer ${ASANA_PAT}` },
  });
  return await r.json();
}

async function verify(secret: string, body: string, sigHex: string): Promise<boolean> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const hex = [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, "0")).join("");
  return hex === sigHex;
}
