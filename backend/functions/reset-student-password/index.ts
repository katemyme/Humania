// =====================================================================
// Edge Function: reset-student-password
// Permite que un DOCENTE restablezca la contraseña de un alumno
// que pertenece a UNA DE SUS SALAS.
//
// Por qué existe: cambiar la contraseña de otro usuario requiere la
// service_role, que NUNCA puede estar en el panel web ni en el juego.
// Aquí vive segura, del lado del servidor.
//
// Validaciones que hace antes de cambiar nada:
//   1. Quien llama tiene sesión válida.
//   2. Su rol es 'admin' (docente).
//   3. El alumno pertenece a una sala de ESE docente.
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

// Variables que Supabase inyecta solas (no hay que configurarlas).
// Se usan alternativas por si el proyecto ya migró a las claves nuevas.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const PUBLIC_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
const SECRET_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY")!;

// Contraseña temporal legible (sin caracteres ambiguos como 0/O o 1/I)
function tempPassword(len = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let out = "";
  for (const b of bytes) out += chars[b % chars.length];
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Falta el token de sesión" }, 401);

    // Cliente que actúa COMO el docente que llama (para identificarlo)
    const caller = createClient(SUPABASE_URL, PUBLIC_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await caller.auth.getUser();
    if (userErr || !user) return json({ error: "Sesión inválida" }, 401);

    // Cliente con permisos de administrador (solo existe aquí, en el servidor)
    const admin = createClient(SUPABASE_URL, SECRET_KEY);

    // --- 1. ¿Quien llama es docente? ---
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return json({ error: "Solo un docente puede restablecer contraseñas" }, 403);
    }

    // --- 2. Leer los datos de la petición ---
    const { student_id, new_password } = await req.json();
    if (!student_id) return json({ error: "Falta student_id" }, 400);

    // --- 3. ¿El alumno está en una sala de ESTE docente? ---
    const { data: membership } = await admin
      .from("group_members")
      .select("group_id, groups!inner(teacher_id)")
      .eq("student_id", student_id)
      .eq("groups.teacher_id", user.id)
      .limit(1);

    if (!membership || membership.length === 0) {
      return json({ error: "Ese alumno no pertenece a ninguna de tus salas" }, 403);
    }

    // --- 4. Cambiar la contraseña ---
    const password =
      new_password && String(new_password).length >= 6
        ? String(new_password)
        : tempPassword();

    const { error: updErr } = await admin.auth.admin.updateUserById(student_id, {
      password,
    });

    if (updErr) return json({ error: updErr.message }, 400);

    // Se devuelve para que el docente se la dicte al alumno una sola vez.
    return json({ ok: true, password });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});