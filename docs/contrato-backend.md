# Contrato del backend (para el equipo)

Lo completa la Persona 1 (Backend) una vez montado Supabase.
Es lo que las Personas 2 y 3 necesitan para conectar sus clientes.

## Acceso
- URL del proyecto: `https://TU-PROYECTO.supabase.co`
- anon key (pública): `...`
- La service_role NUNCA se comparte ni se sube al repo.

## Autenticación
- Registro: se pasan `username`, `full_name` y `role` en los metadatos.
- Login: email/contraseña (los alumnos usan un email sintético interno).

## Tablas y funciones por cliente

### Panel web (docente)
- Salas: `groups` (el join_code se autogenera), `group_kingdoms`
- Preguntas: `questions`, `question_options`
- Reportes (lectura): `player_progress`, `player_responses`, `unlocked_skills`

### Juego (alumno)
- Unirse a una sala: función `join_group('CODIGO')`
- Leer contenido: `kingdoms`, `levels`, `skills`, `questions`, `question_options`
- Guardar avance: `player_responses`, `player_progress`, `unlocked_skills`

## Nota
La seguridad la aplican las políticas RLS en el backend; los clientes no la manejan.
