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

- Registro: se pasan `username`, `full_name` y `role` en los metadatos del usuario. Un trigger crea el perfil automáticamente en `profiles`.
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

Juego (alumno)

- Unirse a una sala: función `join_group('CODIGO')`
- Leer contenido: `kingdoms`, `levels`, `skills`, `questions`, `question_options`
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

 Nota de seguridad

La seguridad la aplican las políticas RLS dentro de la base de datos: cada rol solo ve y modifica lo que le corresponde. Los clientes no manejan permisos, solo hacen sus consultas con la clave pública.