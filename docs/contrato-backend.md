Acceso

- URL del proyecto: `https://lbvmqlsqyozzjmlxjneq.supabase.co`
- Clave pública (publishable / anon): `sb_publishable_q3Sf6KTaskTxkHZFAj7imw_dSLKDSUW`
- La clave secreta (`service_role` / `sb_secret_`) nunca se comparte ni se sube al repo. Solo vive dentro de las Edge Functions.

Ejemplo de inicialización del cliente:

```js
const supabase = createClient(
  "https://lbvmqlsqyozzjmlxjneq.supabase.co",
  "sb_publishable_q3Sf6KTaskTxkHZFAj7imw_dSLKDSUW"
);
```

 Autenticación

- Registro: todo usuario nace con rol `usuario` (el trigger lo fuerza, ya no lee `role` de los metadatos — antes cualquiera podía registrarse como `admin`). Un docente solo se vuelve `admin` a través de la Edge Function `registrar-docente` con un código de institución válido.
- Login: email + contraseña. Los alumnos usan un email sintético interno (no se les pide correo real).
- La confirmación por email está desactivada, así que los usuarios pueden entrar apenas se registran.

Roles

| Rol | Quién es | Qué puede hacer |
|---|---|---|
| `admin` | Docente | Gestiona sus salas, preguntas y ve sus reportes |
| `usuario` | Alumno | Juega y guarda su propio progreso |
| `auditor` | Revisor | Solo lectura de todo |

Usuarios de prueba

| Email | Rol |
|---|---|
| `docente@humania.test` | admin |
| `alumno@humania.test` | usuario |
| `auditor@humania.test` | auditor |
Tablas y funciones por cliente

Panel web (docente)

- Salas: `groups` (el `join_code` se autogenera al insertar), `group_kingdoms`
-Preguntas: `questions`, `question_options`
- Reportes (lectura): `player_progress`, `player_responses`, `unlocked_skills`
- Alumnos de una sala: `group_members`, `profiles`

`questions.group_id` (agregado en `backend/migrations/0002_preguntas_por_sala.sql`):
`null` = contenido base del juego (lo lee cualquiera, no editable desde el panel).
Con valor = pregunta propia de esa sala: solo la ven su docente, los alumnos
miembros de esa sala y el auditor. Ningún otro docente. Al crear una pregunta
desde el panel, el docente debe elegir a cuál de sus salas pertenece.

Juego (alumno)

- Unirse a una sala: función `join_group('CODIGO')`
- Leer contenido: `kingdoms`, `levels`, `skills`, `questions`, `question_options`
  - Importante: al pedir preguntas de un reino para una sala, filtrar por
    `questions.group_id is null or questions.group_id = <id de la sala actual>`.
    Si solo se filtra por `kingdom_id`, RLS ya bloquea las preguntas de salas
    ajenas, pero igual hay que armar el query con ese filtro para no traer
    menos de lo esperado (o para no depender de que RLS oculte filas en
    silencio en vez de excluirlas explícitamente en el query).
- Guardar avance: `player_responses`, `player_progress`, `unlocked_skills`

 Edge Function

`reset-student-password` — permite que un docente restablezca la contraseña de un alumno de sus salas. Devuelve una contraseña temporal para que se la dicte.

```js
const { data, error } = await supabase.functions.invoke('reset-student-password', {
  body: { student_id: alumnoId }
});
// data.password → contraseña temporal
```

Valida por dentro que quien llama sea docente y que el alumno pertenezca a una de sus salas.

`registrar-docente` — PÚBLICA (no requiere sesión, Verify JWT desactivado): crea la cuenta de un docente si el código de institución es válido, y le asigna el rol que otorgue el código (`invitation_codes.grants_role`, hoy siempre `admin`). NUNCA usar `supabase.auth.signUp` para esto: esa cuenta nacería `usuario` y no podría entrar al panel.

```js
const { data, error } = await supabase.functions.invoke('registrar-docente', {
  body: { email, password, full_name, code }
});
// error trae el mensaje en español tal cual mostrarlo (código inválido, correo ya registrado, etc.)
// data.ok === true si se creó — después hay que iniciar sesión con signInWithPassword
```

 Nota de seguridad

La seguridad la aplican las políticas RLS dentro de la base de datos: cada rol solo ve y modifica lo que le corresponde. Los clientes no manejan permisos, solo hacen sus consultas con la clave pública.

`profiles.role` no se puede cambiar desde ningún cliente (panel ni juego), ni siquiera actualizando la propia fila. Hay un trigger (`protect_profile_role`, `backend/migrations/0004_blindar_rol.sql`) que revierte en silencio cualquier intento de `update` sobre `role` que no venga de `service_role` o de una conexión administrativa. Si el juego necesita subir de rol a alguien (no debería), tiene que ser vía una Edge Function con la clave secreta, igual que `registrar-docente`.