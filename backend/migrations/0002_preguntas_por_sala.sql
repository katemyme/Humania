-- =====================================================================
-- 0002 — Preguntas por sala.
-- questions.group_id: NULL = contenido base (visible para todos, no
-- editable desde el panel). Con valor = pregunta propia de esa sala:
-- la ven su docente, los alumnos de esa sala y el auditor. Ningún otro
-- docente.
-- Ejecutar una sola vez en Supabase Dashboard > SQL Editor.
-- =====================================================================

alter table public.questions
  add column group_id uuid references public.groups(id) on delete cascade;

create index idx_questions_group on public.questions(group_id);

drop policy if exists questions_read on public.questions;
create policy questions_read on public.questions for select to authenticated
  using (
    group_id is null
    or public.get_my_role() = 'auditor'
    or public.is_group_teacher(group_id)
    or public.is_group_member(group_id)
  );

drop policy if exists questions_author on public.questions;
create policy questions_author on public.questions for all to authenticated
  using ( author_id = auth.uid() and public.get_my_role() = 'admin' and public.is_group_teacher(group_id) )
  with check ( author_id = auth.uid() and public.get_my_role() = 'admin' and public.is_group_teacher(group_id) );

-- question_options hereda la visibilidad de su pregunta.
drop policy if exists qoptions_read on public.question_options;
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
