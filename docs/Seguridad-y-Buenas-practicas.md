Seguridad y Buenas Prácticas
Este documento describe el modelo de roles y permisos del sistema Humania y las buenas prácticas de seguridad aplicadas durante su desarrollo. Todas las medidas se aplican en el backend (Supabase / PostgreSQL), de modo que la seguridad no depende de los clientes.
Definición de roles y permisos
El sistema define tres roles, alineados con los requerimientos del reto. El rol de cada usuario se guarda en la base de datos y determina, mediante políticas de seguridad, a qué datos puede acceder y qué acciones puede realizar.
Rol	En la app	Permisos
admin	Docente	Crea y gestiona sus propias salas; asigna reinos; crea y edita sus preguntas; consulta los reportes de sus salas; restablece la contraseña de los alumnos de sus salas.
usuario	Alumno	Se une a una sala mediante un código; juega; guarda y consulta únicamente su propio progreso y sus respuestas.
auditor	Revisor	Acceso de solo lectura a la información del sistema (salas, progreso y respuestas de todos los usuarios). No puede crear, editar ni eliminar datos ajenos: ninguna política le permite escribir sobre salas, preguntas, progreso ni respuestas de otras personas.

La asignación de permisos no se realiza en el cliente: se aplica en la base de datos mediante políticas de seguridad a nivel de fila (Row Level Security), por lo que un usuario no puede acceder a datos que no le corresponden aunque manipule la aplicación.
Modelo de seguridad (Row Level Security)
●	RLS activo en todas las tablas: cada tabla tiene políticas que restringen la lectura y escritura según el rol y la pertenencia del usuario (por ejemplo, un docente solo ve sus salas y un alumno solo su propio progreso).
●	Funciones SECURITY DEFINER: las comprobaciones de permisos (rol del usuario, si es docente o miembro de una sala) se realizan mediante funciones controladas del servidor, lo que evita exponer lógica sensible y previene errores de recursión entre políticas.
●	La seguridad vive en el backend: los clientes (panel web y juego) solo realizan consultas; no gestionan permisos por su cuenta.
Gestión de credenciales
●	Clave pública en los clientes: el panel web y el juego usan únicamente la clave pública (anon / publishable), diseñada para exponerse en el cliente.
●	Clave secreta solo en el servidor: la clave de servicio (service_role) nunca se incluye en los clientes ni se sube al repositorio; solo existe dentro de las funciones del servidor (Edge Functions).
●	Secretos fuera del repositorio: el .gitignore excluye los archivos de entorno (.env, .env.local) y cualquier archivo de secretos, de modo que una clave privada no puede subirse por descuido. La clave pública sí viaja en el código de los clientes (panel-web/src/supabaseClient.js y juego-unity/Assets/Supabase/SupabaseConfig.cs), que es su uso previsto; el panel permite además sobrescribirla con variables de entorno (.env.local) para apuntar a otro proyecto de Supabase.
Autenticación y control de acceso
●	Registro controlado de docentes: para crear una cuenta de docente se exige un código de institución que se valida y se consume en el servidor (con cupos y caducidad). El rol nunca se decide en el cliente. El código de esta demostración se publica en el README para que el evaluador pueda registrarse; en un despliegue real se entregaría a cada institución.
●	Rol seguro por defecto: al registrarse, todo usuario se crea con el rol de alumno; el ascenso de rol solo puede realizarse desde el servidor.
●	Protección de la columna de rol: un mecanismo en la base de datos impide que un usuario modifique su propio rol. Durante el desarrollo se detectó y corrigió una posible escalada de privilegios, y se verificó el cierre de la vulnerabilidad.
●	Recuperación de contraseña mediada: la contraseña de un alumno solo puede restablecerla su docente, desde la ficha del alumno en el panel. La operación la ejecuta una función del servidor (reset-student-password) que comprueba que quien llama tiene sesión válida, rol de docente y una sala en común con ese alumno; la contraseña resultante se muestra una sola vez para que el docente se la dicte.
Privacidad y protección de menores
●	Sin recolección de correos de menores: los alumnos acceden con usuario, contraseña y código de sala, sin necesidad de proporcionar un correo electrónico.
●	Diseño apropiado para la edad: la gestión de cuentas de los estudiantes está mediada por el docente, reduciendo la exposición de datos personales de menores.
Buenas prácticas de código y del proyecto
●	Repositorio organizado: monorepo dividido por áreas (backend, panel web, juego y documentación), con reglas para excluir archivos generados y secretos.
●	Separación por capas: los proyectos separan el acceso a datos, la interfaz y la lógica, favoreciendo la legibilidad y el mantenimiento.
●	Historial de commits legible: los commits siguen prefijos convencionales por tipo de cambio (feat, fix, docs, chore, refactor) y describen en español qué se hizo, lo que documenta la evolución del proyecto.
●	Base de datos normalizada: el esquema está en tercera forma normal (3FN), por encima del mínimo solicitado. La excepción deliberada es player_responses.is_correct: el acierto se guarda tal como se evaluó en el momento de responder, en lugar de recalcularse contra question_options, para que un reporte antiguo no cambie si el docente edita o elimina después esa opción. Por el mismo motivo player_progress conserva los totales acumulados (niveles completados y puntaje) del alumno en cada reino.
Evidencia
Las medidas descritas están respaldadas por el código del repositorio: las políticas de seguridad a nivel de fila y las funciones del servidor se encuentran en el script del esquema de la base de datos (backend/humania_backend.sql) y en las funciones del servidor (backend/functions). Este documento resume y explica dichas medidas.
