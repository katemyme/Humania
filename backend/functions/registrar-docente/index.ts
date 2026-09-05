// =====================================================================
// Edge Function: registrar-docente
//
// Crea la cuenta de un docente SOLO si presenta un código de institución
// válido. El rol nunca lo decide el cliente: se asigna aquí, en el
// servidor, con la clave secreta.
//
// IMPORTANTE: esta función debe ser PÚBLICA (Verify JWT desactivado),
// porque quien se registra todavía no tiene sesión. La protección no es
// el token: es el código de institución.
// =====================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SECRET_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  let code = "";
  const admin = createClient(SUPABASE_URL, SECRET_KEY);

  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.full_name ?? "").trim();
    code = String(body.code ?? "").trim();

    // --- Validaciones básicas ---
    if (!email || !email.includes("@")) {
      return json({ error: "Escribe un correo válido" }, 400);
    }
    if (password.length < 8) {
      return json({ error: "La contraseña debe tener al menos 8 caracteres" }, 400);
    }
    if (!fullName) {
      return json({ error: "Escribe tu nombre completo" }, 400);
    }
    if (!code) {
      return json({ error: "Falta el código de institución" }, 400);
    }

    // --- 1. Validar y consumir el código (atómico) ---
    const { data: grantedRole, error: codeErr } = await admin.rpc(
      "consume_invitation_code",
      { p_code: code },
    );

    if (codeErr || !grantedRole) {
      return json(
        { error: "Código de institución inválido, vencido o sin cupos disponibles" },
        403,
      );
    }

    // --- 2. Crear la cuenta ---
    const username = email.split("@")[0];

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, full_name: fullName },
    });

    if (createErr || !created?.user) {
      // Devolver el cupo, porque la cuenta no llegó a crearse
      await admin.rpc("release_invitation_code", { p_code: code });

      const msg = (createErr?.message ?? "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return json({ error: "Ya existe una cuenta con ese correo" }, 409);
      }
      if (msg.includes("username") || msg.includes("duplicate")) {
        return json({ error: "Ese nombre de usuario ya está en uso" }, 409);
      }
      return json({ error: "No se pudo crear la cuenta. Intenta de nuevo." }, 400);
    }

    // --- 3. Asignar el rol que otorga el código ---
    const { error: roleErr } = await admin
      .from("profiles")
      .update({ role: grantedRole, full_name: fullName })
      .eq("id", created.user.id);

    if (roleErr) {
      // La cuenta quedó creada pero sin rol: se elimina para no dejar basura
      await admin.auth.admin.deleteUser(created.user.id);
      await admin.rpc("release_invitation_code", { p_code: code });
      return json({ error: "No se pudo completar el registro. Intenta de nuevo." }, 500);
    }

    return json({ ok: true, role: grantedRole });
  } catch (e) {
    if (code) await admin.rpc("release_invitation_code", { p_code: code });
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
