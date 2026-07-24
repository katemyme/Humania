-- =====================================================================
-- HUMANIA — Backend completo (PostgreSQL / Supabase)
-- Ejecutar en: Supabase Dashboard > SQL Editor (una sola corrida)
-- Orden: extensiones > tipos > tablas > índices > funciones > RLS > semilla
-- Roles del reto: admin (docente) · usuario (alumno) · auditor (solo lectura)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extensiones
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists citext;     -- username sin distinguir mayúsculas

-- ---------------------------------------------------------------------
-- 1. Tipos enumerados
-- ---------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('admin','usuario','auditor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.question_type as enum ('dilema','cronologia','decision','palabra_clave');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2. Perfiles (extiende auth.users de Supabase)
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    citext not null unique,
  full_name   text,
  role        public.user_role not null default 'usuario',
  created_at  timestamptz not null default now(),
  constraint username_len check (char_length(username::text) between 3 and 30)
);

-- ---------------------------------------------------------------------
-- 3. Contenido del juego
-- ---------------------------------------------------------------------
create table public.kingdoms (
  id           smallint generated always as identity primary key,
  code         text not null unique,               -- 'verde', 'rojo'
  name         text not null,
  theme        text not null,                       -- eje temático
  boss_name    text not null,
  color_hex    text,
  order_index  smallint not null unique,            -- orden en el hub
  created_at   timestamptz not null default now()
);

create table public.levels (
  id           integer generated always as identity primary key,
  kingdom_id   smallint not null references public.kingdoms(id) on delete cascade,
  name         text not null,
  layer        text not null check (layer in ('plataforma','puzzle','coleccion','boss')),
  order_index  smallint not null,
  unique (kingdom_id, order_index)
);

create table public.skills (
  id           integer generated always as identity primary key,
  kingdom_id   smallint not null references public.kingdoms(id) on delete cascade,
  code         text not null unique,
  name         text not null,
  description  text
);

create table public.questions (
  id           uuid primary key default gen_random_uuid(),
  kingdom_id   smallint not null references public.kingdoms(id) on delete cascade,
  level_id     integer references public.levels(id) on delete set null,
  author_id    uuid references public.profiles(id) on delete set null,  -- null = contenido base
  -- group_id se agrega más abajo con alter table (groups aún no existe aquí);
  -- null = contenido base, con valor = pregunta propia de esa sala
  type         public.question_type not null,
  prompt       text not null,
  created_at   timestamptz not null default now()
);

create table public.question_options (
  id             integer generated always as identity primary key,
  question_id    uuid not null references public.questions(id) on delete cascade,
  content        text not null,
  is_correct     boolean not null default false,    -- para opción múltiple / dilema
  correct_order  smallint,                          -- para cronología (posición correcta)
  order_index    smallint not null default 0,
  unique (question_id, order_index)
);

-- ---------------------------------------------------------------------
-- 4. Aula: salas, reinos asignados y membresía
-- ---------------------------------------------------------------------
create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  join_code   text not null unique,                 -- autogenerado por trigger
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.group_kingdoms (
  group_id    uuid not null references public.groups(id) on delete cascade,
  kingdom_id  smallint not null references public.kingdoms(id) on delete cascade,
  primary key (group_id, kingdom_id)
);

create table public.group_members (
  group_id    uuid not null references public.groups(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  primary key (group_id, student_id)
);

-- 4.1 Preguntas propias de una sala. NULL = contenido base (ver también
--     comentario en public.questions). Se agrega aquí porque groups
--     todavía no existía cuando se creó la tabla questions.
alter table public.questions
  add column group_id uuid references public.groups(id) on delete cascade;

-- ---------------------------------------------------------------------
-- 5. Progreso (siempre por alumno + sala)
-- ---------------------------------------------------------------------
create table public.player_progress (
  id             bigint generated always as identity primary key,
  student_id     uuid not null references public.profiles(id) on delete cascade,
  group_id       uuid not null references public.groups(id) on delete cascade,
  kingdom_id     smallint not null references public.kingdoms(id) on delete cascade,
  crystal_earned boolean not null default false,
  levels_done    smallint not null default 0,
  score          integer not null default 0,
  updated_at     timestamptz not null default now(),
  unique (student_id, group_id, kingdom_id)
);

create table public.player_responses (
  id           bigint generated always as identity primary key,
  student_id   uuid not null references public.profiles(id) on delete cascade,
  group_id     uuid not null references public.groups(id) on delete cascade,
  question_id  uuid not null references public.questions(id) on delete cascade,
  option_id    integer references public.question_options(id) on delete set null,
  is_correct   boolean not null default false,
  answered_at  timestamptz not null default now()
);

create table public.unlocked_skills (
  student_id   uuid not null references public.profiles(id) on delete cascade,
  group_id     uuid not null references public.groups(id) on delete cascade,
  skill_id     integer not null references public.skills(id) on delete cascade,
  unlocked_at  timestamptz not null default now(),
  primary key (student_id, group_id, skill_id)
);

-- ---------------------------------------------------------------------
-- 6. Índices (claves foráneas y consultas frecuentes)
-- ---------------------------------------------------------------------
create index idx_levels_kingdom       on public.levels(kingdom_id);
create index idx_skills_kingdom       on public.skills(kingdom_id);
create index idx_questions_kingdom    on public.questions(kingdom_id);
create index idx_questions_level      on public.questions(level_id);
create index idx_questions_group      on public.questions(group_id);
create index idx_qoptions_question    on public.question_options(question_id);
create index idx_groups_teacher       on public.groups(teacher_id);
create index idx_members_student      on public.group_members(student_id);
create index idx_progress_group       on public.player_progress(group_id);
create index idx_responses_group      on public.player_responses(group_id);
create index idx_responses_question   on public.player_responses(question_id);

-- ---------------------------------------------------------------------
-- 7. Funciones
-- ---------------------------------------------------------------------

-- 7.1 Crea el perfil automáticamente al registrarse en Auth.
--     NOTA DE SEGURIDAD: aquí se toma el rol de los metadatos para permitir
--     que un docente se registre como 'admin'. En producción conviene
--     forzar 'usuario' por defecto y elevar el rol desde un panel controlado.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(coalesce(new.email,'user'), '@', 1)),
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'usuario')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7.2 Devuelve el rol del usuario actual sin recursión de RLS (security definer).
create or replace function public.get_my_role()
returns public.user_role
language sql stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 7.2b Evitan la recursión entre las políticas de groups y group_members
--      (groups_member_read consulta group_members y gm_teacher consulta groups).
create or replace function public.is_group_teacher(p_group_id uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (select 1 from public.groups g where g.id = p_group_id and g.teacher_id = auth.uid());
$$;

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (select 1 from public.group_members m where m.group_id = p_group_id and m.student_id = auth.uid());
$$;

-- 7.3 Genera un código de sala único (sin caracteres ambiguos).
create or replace function public.generate_join_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(chars, 1 + floor(random()*length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.groups where join_code = code);
  end loop;
  return code;
end;
$$;

create or replace function public.set_join_code()
returns trigger language plpgsql as $$
begin
  if new.join_code is null or new.join_code = '' then
    new.join_code := public.generate_join_code();
  end if;
  return new;
end;
$$;

create trigger trg_set_join_code
  before insert on public.groups
  for each row execute function public.set_join_code();

-- 7.4 Un alumno se une a una sala por código (bypass seguro de RLS).
create or replace function public.join_group(p_code text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  g_id uuid;
begin
  select id into g_id
  from public.groups
  where join_code = upper(p_code) and is_active = true;

  if g_id is null then
    raise exception 'Código de sala inválido o inactivo';
  end if;

  insert into public.group_members (group_id, student_id)
  values (g_id, auth.uid())
  on conflict do nothing;

  return g_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 8. Seguridad a nivel de fila (RLS) + políticas por rol
-- ---------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.kingdoms          enable row level security;
alter table public.levels            enable row level security;
alter table public.skills            enable row level security;
alter table public.questions         enable row level security;
alter table public.question_options  enable row level security;
alter table public.groups            enable row level security;
alter table public.group_kingdoms    enable row level security;
alter table public.group_members     enable row level security;
alter table public.player_progress   enable row level security;
alter table public.player_responses  enable row level security;
alter table public.unlocked_skills   enable row level security;

-- 8.1 Perfiles: cada quien ve el suyo; admin y auditor ven todos.
create policy profiles_select on public.profiles for select to authenticated
  using ( id = auth.uid() or public.get_my_role() in ('admin','auditor') );
create policy profiles_update_self on public.profiles for update to authenticated
  using ( id = auth.uid() );

-- 8.2 Contenido base (reinos, niveles, skills): lo lee cualquier autenticado;
--     solo un admin puede modificarlo.
create policy kingdoms_read on public.kingdoms for select to authenticated using ( true );
create policy kingdoms_admin on public.kingdoms for all to authenticated
  using ( public.get_my_role() = 'admin' ) with check ( public.get_my_role() = 'admin' );

create policy levels_read on public.levels for select to authenticated using ( true );
create policy levels_admin on public.levels for all to authenticated
  using ( public.get_my_role() = 'admin' ) with check ( public.get_my_role() = 'admin' );

create policy skills_read on public.skills for select to authenticated using ( true );
create policy skills_admin on public.skills for all to authenticated
  using ( public.get_my_role() = 'admin' ) with check ( public.get_my_role() = 'admin' );

-- 8.3 Preguntas y opciones: lectura para autenticados; el docente gestiona las suyas.
-- questions: contenido base (group_id null) lo lee cualquiera; una pregunta
-- propia de una sala solo la ven su docente, los alumnos de esa sala y el auditor.
create policy questions_read on public.questions for select to authenticated
  using (
    group_id is null
    or public.get_my_role() = 'auditor'
    or public.is_group_teacher(group_id)
    or public.is_group_member(group_id)
  );
create policy questions_author on public.questions for all to authenticated
  using ( author_id = auth.uid() and public.get_my_role() = 'admin' and public.is_group_teacher(group_id) )
  with check ( author_id = auth.uid() and public.get_my_role() = 'admin' and public.is_group_teacher(group_id) );

-- question_options hereda la visibilidad de su pregunta.
create policy qoptions_read on public.question_options for select to authenticated
  using (
    exists (
      select 1 from public.questions q
      where q.id = question_id
        and (
          q.group_id is null
          or public.get_my_role() = 'auditor'
          or public.is_group_teacher(q.group_id)
          or public.is_group_member(q.group_id)
        )
    )
  );
create policy qoptions_author on public.question_options for all to authenticated
  using ( exists (select 1 from public.questions q where q.id = question_id and q.author_id = auth.uid()) )
  with check ( exists (select 1 from public.questions q where q.id = question_id and q.author_id = auth.uid()) );

-- 8.4 Salas: el docente gestiona las suyas; el alumno ve donde es miembro; el auditor ve todo.
create policy groups_teacher on public.groups for all to authenticated
  using ( teacher_id = auth.uid() ) with check ( teacher_id = auth.uid() );
create policy groups_member_read on public.groups for select to authenticated
  using ( public.is_group_member(id) );
create policy groups_auditor_read on public.groups for select to authenticated
  using ( public.get_my_role() = 'auditor' );

-- 8.5 Reinos asignados a una sala.
create policy gk_teacher on public.group_kingdoms for all to authenticated
  using ( exists (select 1 from public.groups g where g.id = group_id and g.teacher_id = auth.uid()) )
  with check ( exists (select 1 from public.groups g where g.id = group_id and g.teacher_id = auth.uid()) );
create policy gk_read on public.group_kingdoms for select to authenticated
  using (
    public.get_my_role() = 'auditor'
    or exists (select 1 from public.groups g where g.id = group_id and g.teacher_id = auth.uid())
    or exists (select 1 from public.group_members m where m.group_id = group_id and m.student_id = auth.uid())
  );

-- 8.6 Membresía: el alumno ve/abandona la suya (se une vía join_group);
--     el docente gestiona la de sus salas; el auditor lee.
create policy gm_student_read on public.group_members for select to authenticated
  using ( student_id = auth.uid() );
create policy gm_student_leave on public.group_members for delete to authenticated
  using ( student_id = auth.uid() );
create policy gm_teacher on public.group_members for all to authenticated
  using ( public.is_group_teacher(group_id) )
  with check ( public.is_group_teacher(group_id) );
create policy gm_auditor_read on public.group_members for select to authenticated
  using ( public.get_my_role() = 'auditor' );

-- 8.7 Progreso, respuestas y skills: el alumno gestiona lo suyo;
--     el docente de la sala lo lee; el auditor lee todo.
create policy pp_student on public.player_progress for all to authenticated
  using ( student_id = auth.uid() ) with check ( student_id = auth.uid() );
create policy pp_teacher_read on public.player_progress for select to authenticated
  using ( exists (select 1 from public.groups g where g.id = group_id and g.teacher_id = auth.uid()) );
create policy pp_auditor_read on public.player_progress for select to authenticated
  using ( public.get_my_role() = 'auditor' );

create policy pr_student on public.player_responses for all to authenticated
  using ( student_id = auth.uid() ) with check ( student_id = auth.uid() );
create policy pr_teacher_read on public.player_responses for select to authenticated
  using ( exists (select 1 from public.groups g where g.id = group_id and g.teacher_id = auth.uid()) );
create policy pr_auditor_read on public.player_responses for select to authenticated
  using ( public.get_my_role() = 'auditor' );

create policy us_student on public.unlocked_skills for all to authenticated
  using ( student_id = auth.uid() ) with check ( student_id = auth.uid() );
create policy us_teacher_read on public.unlocked_skills for select to authenticated
  using ( exists (select 1 from public.groups g where g.id = group_id and g.teacher_id = auth.uid()) );
create policy us_auditor_read on public.unlocked_skills for select to authenticated
  using ( public.get_my_role() = 'auditor' );

-- ---------------------------------------------------------------------
-- 9. Datos semilla (2 reinos, niveles, skills, una pregunta de ejemplo)
-- ---------------------------------------------------------------------
insert into public.kingdoms (code, name, theme, boss_name, color_hex, order_index) values
  ('verde','Reino Verde — Identidad','Identidad de género y autoconocimiento','El Estereotipo','#1F6F54',1),
  ('rojo' ,'Reino Rojo — Derechos'  ,'Derechos de la mujer y marco legal'    ,'La Ignorancia' ,'#9C2B2B',2);

insert into public.levels (kingdom_id, name, layer, order_index) values
  ((select id from public.kingdoms where code='verde'),'Bosque descolorido','plataforma',1),
  ((select id from public.kingdoms where code='verde'),'Siluetas-molde'     ,'puzzle'    ,2),
  ((select id from public.kingdoms where code='verde'),'El Estereotipo'     ,'boss'      ,3),
  ((select id from public.kingdoms where code='rojo') ,'Leyes rotas'        ,'plataforma',1),
  ((select id from public.kingdoms where code='rojo') ,'Códice de derechos' ,'puzzle'    ,2),
  ((select id from public.kingdoms where code='rojo') ,'La Ignorancia'      ,'boss'      ,3);

insert into public.skills (kingdom_id, code, name, description) values
  ((select id from public.kingdoms where code='verde'),'espejo_verdad','Espejo de la Verdad','Revela a la persona real tras la silueta-molde'),
  ((select id from public.kingdoms where code='verde'),'voz_propia'   ,'Voz Propia'         ,'Afirma tu elección y rompe un molde impuesto'),
  ((select id from public.kingdoms where code='rojo') ,'memoria_legal','Memoria Legal'      ,'Recuerda una ley para reconstruir o iluminar'),
  ((select id from public.kingdoms where code='rojo') ,'cronologia'   ,'Cronología'         ,'Revela el orden correcto de una secuencia');

with q as (
  insert into public.questions (kingdom_id, type, prompt)
  values ((select id from public.kingdoms where code='verde'),'dilema',
          '"El que cocina no puede ser valiente, ¿verdad?"')
  returning id
)
insert into public.question_options (question_id, content, is_correct, order_index)
select q.id, v.content, v.correct, v.ord
from q, (values
  ('Cocinar y ser valiente no se excluyen', true , 1),
  ('Correcto, son cosas opuestas'         , false, 2)
) as v(content, correct, ord);

-- =====================================================================
-- FIN. Recomendado: probar con tres usuarios (admin, usuario, auditor)
-- y recorrer el flujo antes de conectar los clientes (solo anon key).
-- =====================================================================
