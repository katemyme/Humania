-- =====================================================================
-- Migración 0004 — Blindar la columna `role` de profiles
--
-- Problema: la política `profiles_update_self` se declaró con USING pero
-- sin WITH CHECK. Postgres entonces reutiliza el USING como check, y como
-- `id` no cambia durante el UPDATE, la condición `id = auth.uid()` sigue
-- siendo cierta aunque en la misma operación se modifique el rol.
-- Resultado: cualquier alumno logueado podía ejecutar
--     update profiles set role = 'admin' where id = <su propio id>
-- desde la consola del navegador y entrar al panel como docente,
-- saltándose el código de institución y la Edge Function.
--
-- Solución: RLS decide QUÉ FILAS puedes tocar, no QUÉ COLUMNAS. Para
-- proteger una columna concreta se usa un trigger.
--
-- IMPORTANTE: esta función NO debe ser SECURITY DEFINER. Si lo fuera,
-- current_user pasaría a ser el dueño de la función y la comprobación
-- daría permiso siempre.
-- =====================================================================

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
declare
  v_jwt_role text;
begin
  -- Solo interviene si de verdad se está intentando cambiar el rol
  if new.role is distinct from old.role then

    v_jwt_role := coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role',
      ''
    );

    -- Se permite el cambio solo desde el servidor (service_role) o desde
    -- una conexión administrativa (SQL Editor / Table Editor).
    if v_jwt_role <> 'service_role'
       and current_user not in ('service_role', 'postgres', 'supabase_admin')
    then
      -- Se revierte en silencio: así un update legítimo de otros campos
      -- (por ejemplo el nombre) no falla, pero el rol no se mueve.
      new.role := old.role;
    end if;

  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_profile_role on public.profiles;

create trigger trg_protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- =====================================================================
-- COMPROBACIÓN (importante hacerla):
--   1. Inicia sesión como alumno en el navegador.
--   2. En la consola:
--        await supabase.from('profiles')
--          .update({ role: 'admin' })
--          .eq('id', (await supabase.auth.getUser()).data.user.id);
--   3. Recarga y vuelve a leer su perfil: el rol debe seguir en 'usuario'.
--   4. Confirma que la Edge Function `registrar-docente` sigue creando
--      docentes correctamente (usa service_role, así que sí puede).
-- =====================================================================
