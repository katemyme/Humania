-- =====================================================================
-- Migración 0005 — Acotar la lectura de profiles
--
-- Problema: la política original era
--     using ( id = auth.uid() or public.get_my_role() in ('admin','auditor') )
-- Es decir, CUALQUIER docente podía leer TODOS los perfiles de la base:
-- los alumnos de otros docentes y los datos de los demás profesores.
-- No hacía falta compartir sala ni nada: bastaba con tener rol 'admin'.
--
-- Se detectó registrando una cuenta nueva con el código de institución
-- (que es público, va en el README para que el evaluador se registre) y
-- leyendo `profiles` sin tener ninguna sala: devolvió la tabla entera.
-- En un proyecto sobre protección de menores es el peor sitio para
-- filtrar datos.
--
-- Solución: un docente solo ve su propio perfil y el de los alumnos que
-- son miembros de ALGUNA DE SUS SALAS. El auditor conserva lectura total
-- (es su función). El alumno sigue viendo solo el suyo.
--
-- IMPORTANTE — por qué hace falta una función SECURITY DEFINER:
-- la comprobación tiene que consultar `group_members` y `groups`, y esas
-- dos tablas tienen sus propias políticas que a su vez llaman a
-- get_my_role(), que lee `profiles`. Escribir el EXISTS en línea dentro
-- de la política de `profiles` cierra el círculo y Postgres aborta con
-- 42P17 (infinite recursion detected in policy). Es el mismo problema
-- que ya resolvieron is_group_teacher / is_group_member en su momento.
-- Al ser SECURITY DEFINER, is_my_student se ejecuta como su dueño y no
-- vuelve a disparar RLS.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ¿El usuario actual es docente de alguna sala donde está este alumno?
-- ---------------------------------------------------------------------
create or replace function public.is_my_student(p_student_id uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.group_members m
    join public.groups g on g.id = m.group_id
    where m.student_id = p_student_id
      and g.teacher_id = auth.uid()
  );
$$;

-- Se apoya en los índices que ya existen:
--   idx_members_student  on group_members(student_id)
--   idx_groups_teacher   on groups(teacher_id)

revoke execute on function public.is_my_student(uuid) from public;
grant  execute on function public.is_my_student(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 2. Nueva política de lectura
-- ---------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;

create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()                        -- mi propio perfil
    or public.get_my_role() = 'auditor'    -- el auditor lee todo (es su rol)
    or public.is_my_student(id)            -- los alumnos de mis salas
  );

-- =====================================================================
-- QUÉ SIGUE FUNCIONANDO (consultas reales del panel, revisadas una a una)
--
--   AuthContext.jsx  → profiles.select('role').eq('id', <mi id>)
--                      cubierto por `id = auth.uid()`
--
--   api.js getReporteSala →
--       group_members.select('student_id, profiles(id, username, full_name)')
--       cubierto por is_my_student(): son alumnos de una sala suya
--
--   api.js getAlumnoResumen →
--       profiles.select(...).eq('id', <studentId>)
--       cubierto por is_my_student()
--
--   Edge Functions (registrar-docente, reset-student-password) usan
--   service_role, así que saltan RLS: no les afecta.
--
-- COMPROBACIÓN (hacerla después de aplicar):
--   1. Registra un docente nuevo con el código de institución.
--   2. Sin crear ninguna sala:
--        await supabase.from('profiles').select('id, full_name')
--      Debe devolver UNA fila: la suya. Antes devolvía la tabla entera.
--   3. Crea una sala, mete un alumno con join_group() y repite:
--      ahora deben aparecer dos filas (él y su alumno).
--   4. Abre el detalle de una sala en el panel y confirma que la tabla
--      de alumnos y el detalle por alumno siguen mostrando los nombres.
--   5. Entra como auditor: debe seguir viendo todos los perfiles.
-- =====================================================================
