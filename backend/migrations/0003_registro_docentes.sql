-- =====================================================================
-- Migración 0003 — Registro de docentes por código de institución
--
-- Cierra un hueco de seguridad: hasta ahora el rol se tomaba de los
-- metadatos del registro, así que cualquiera podía registrarse como
-- 'admin'. A partir de aquí:
--   · Todo usuario nace como 'usuario'.
--   · Solo el servidor (Edge Function) puede elevar el rol, y únicamente
--     si se presenta un código de institución válido.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabla de códigos de institución
-- ---------------------------------------------------------------------
create table if not exists public.invitation_codes (
  id           smallint generated always as identity primary key,
  code         text not null unique,
  institution  text not null,
  grants_role  public.user_role not null default 'admin',
  max_uses     integer not null default 50,
  used_count   integer not null default 0,
  is_active    boolean not null default true,
  expires_at   timestamptz,
  created_at   timestamptz not null default now(),
  constraint uses_within_limit check (used_count <= max_uses)
);

-- RLS activo y SIN políticas: nadie puede leer ni escribir esta tabla
-- desde el cliente. Solo el servidor (service_role) la toca.
alter table public.invitation_codes enable row level security;

-- ---------------------------------------------------------------------
-- 2. Código inicial
-- ---------------------------------------------------------------------
insert into public.invitation_codes (code, institution, grants_role, max_uses)
values ('MINED-2025', 'MINED — Nicaragua', 'admin', 50)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- 3. Consumir un código (valida y descuenta un cupo, todo de una vez)
--    Devuelve el rol que otorga, o falla con un mensaje claro.
-- ---------------------------------------------------------------------
create or replace function public.consume_invitation_code(p_code text)
returns public.user_role
language plpgsql
security definer set search_path = public
as $$
declare
  v_role public.user_role;
begin
  update public.invitation_codes
     set used_count = used_count + 1
   where code = upper(trim(p_code))
     and is_active = true
     and (expires_at is null or expires_at > now())
     and used_count < max_uses
  returning grants_role into v_role;

  if v_role is null then
    raise exception 'Código de institución inválido, vencido o sin cupos disponibles';
  end if;

  return v_role;
end;
$$;

-- Que nadie pueda llamarla desde el cliente: solo el servidor.
revoke execute on function public.consume_invitation_code(text) from public;
revoke execute on function public.consume_invitation_code(text) from anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. Devolver un cupo (si falla la creación de la cuenta a mitad)
-- ---------------------------------------------------------------------
create or replace function public.release_invitation_code(p_code text)
returns void
language sql
security definer set search_path = public
as $$
  update public.invitation_codes
     set used_count = greatest(used_count - 1, 0)
   where code = upper(trim(p_code));
$$;

revoke execute on function public.release_invitation_code(text) from public;
revoke execute on function public.release_invitation_code(text) from anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. El trigger ahora FUERZA el rol 'usuario'
--    (antes lo tomaba de los metadatos → cualquiera podía ser admin)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(coalesce(new.email, 'user'), '@', 1)
    ),
    new.raw_user_meta_data->>'full_name',
    'usuario'   -- SIEMPRE. El rol solo se eleva desde el servidor.
  );
  return new;
end;
$$;

-- =====================================================================
-- NOTA: los usuarios que ya existen conservan su rol actual.
-- Si más adelante necesitas crear un auditor a mano, créalo y luego
-- cambia su rol desde el Table Editor, o dale un código con
-- grants_role = 'auditor'.
-- =====================================================================
