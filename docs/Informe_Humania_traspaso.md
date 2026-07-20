# Informe del proyecto — Humania

Documento de traspaso para el equipo (3 personas). Resume lo acordado, las decisiones tomadas y el orden de trabajo. Empieza por la **Persona 1 (Backend)**, porque es la base que desbloquea a las otras dos.

---

## 1. Resumen del proyecto

Humania es un videojuego educativo para el reto **RETOS — Categoría Aficionado, temática Educación** ("Plataforma de aprendizaje basado en juegos"). El contenido cubre la asignatura de **derechos y dignidad de la mujer** (derechos, prevención de violencia, equidad de género). El público son **estudiantes y docentes de secundaria** (no primaria).

Idea pedagógica central: el "enemigo" nunca es una persona, es una idea (el estereotipo, la ignorancia). Los jefes no se derrotan a golpes: se comprenden y se desarman. Esto es lo que hay que defender ante el jurado.

---

## 2. Decisiones tomadas (resoluciones)

1. **De 5 reinos a 2 (vertical slice)** por tiempo: se conservan **Verde (Identidad)** y **Rojo (Derechos)**. La narrativa se reencuadró a 2 cristales = restauración parcial + gancho al juego completo. Ya existe la propuesta reescrita (ver sección 9).
2. **Arquitectura separada:** el panel del docente es una **web (HTML/JS)** y el juego es **Unity**; ambos hablan con un solo **backend en Supabase**. Es mejor que meter todo en Unity.
3. **Tres roles del reto mapeados:** `admin` = docente · `usuario` = alumno · `auditor` = solo lectura (revisa reportes).
4. **Patrón de código de sala** (estilo Kahoot/Classroom): el docente crea una sala y obtiene un **código único** que comparte con su clase. El alumno entra al juego, se registra e ingresa ese código. Un docente puede tener varias salas.
5. **Registro del alumno sin email:** usuario + contraseña + código de sala. Recuperación de cuenta **mediada por el docente** (privacidad de menores). El email solo se pide al docente. Supabase usa un email sintético interno para los alumnos.
6. **Nombres:** "sala/clase" = lo que crea el docente; "reino/mundo" = contenido del juego. No mezclar.
7. **Base de datos completa** definida: 12 entidades normalizadas, con RLS por rol y funciones auxiliares. El script SQL ya está escrito (ver sección 9).
8. **Un solo repositorio (monorepo)** con carpetas para backend, panel web y juego. Usar `.gitignore` de Unity + Git LFS para binarios pesados.

---

## 3. Arquitectura y repositorio

Dos clientes sobre un backend:

- **Panel web (docente)** → sirve a los roles admin y auditor.
- **Juego Unity (alumno)** → rol usuario.
- **Supabase** → Auth + PostgreSQL con seguridad por filas (RLS). La seguridad vive en el backend, no en los clientes.

Estructura del repo:

```
humania/
├── README.md            → descripción, stack, instalación y ejecución (entregable)
├── .gitignore           → reglas de Unity + web
├── backend/
│   └── humania_backend.sql
├── panel-web/           → panel del docente (HTML/JS)
├── juego-unity/         → proyecto Unity (Assets, ProjectSettings, Packages)
└── docs/                → diagrama ER, user flow, capturas (evidencia)
```

Convención de commits (para la evidencia de avance): prefijar por área — `db:`, `panel:`, `juego:`, `docs:`.

---

## 4. Reparto entre las tres personas

- **Persona 1 — Backend (Supabase):** esquema, Auth, RLS, funciones, datos semilla, diagrama ER y el "contrato" que usarán los demás. **Es la base; empieza primero.**
- **Persona 2 — Panel web (docente):** login del docente, crear/gestionar salas, asignar reinos, editor de preguntas y reportes. Cubre admin + auditor.
- **Persona 3 — Juego Unity (alumno):** registro/login del alumno, unirse por código, hub y la rebanada jugable de los 2 reinos (3 capas + jefe simplificado), guardando progreso.

Los entregables de **Marketing** y **Diseño Gráfico** (Lean Canvas, branding, logo, manual de marca, wireframes, mockups) se reparten aparte según disponibilidad; no bloquean el desarrollo.

---

## 5. Orden general del proyecto (qué va primero)

1. **Primero — Backend (Persona 1).** Hasta que exista el esquema y el "contrato", las otras dos personas no pueden conectar nada real. Es el camino crítico.
2. **Segundo — en paralelo, Panel web (Persona 2) y Juego (Persona 3).** Arrancan en cuanto el backend publique el esquema y el contrato de la sección 7. Mientras el backend termina, pueden ir maquetando pantallas con datos de prueba.
3. **Tercero — Integración.** Conectar los clientes reales al backend y probar el flujo completo: docente crea sala → alumno se une con código → juega → docente ve reportes.
4. **Cierre.** README técnico, video de navegación, evidencia en `docs/` y los entregables de marketing/diseño.

---

## 6. Tareas de la Persona 1 — Backend (paso a paso)

Buena noticia: el esquema ya está escrito (`humania_backend.sql`). El trabajo es montarlo, verificarlo y documentarlo para el equipo.

1. **Crear el proyecto en Supabase** y abrir el SQL Editor.
2. **Ejecutar `humania_backend.sql` completo.** Crea tipos, tablas, índices, funciones, RLS y datos semilla de una sola corrida.
3. **Habilitar el proveedor Email** en Authentication (Auth trabaja con email por debajo, aunque a los alumnos se les genere uno sintético).
4. **Crear 3 usuarios de prueba** pasando `role` en los metadatos: uno `admin`, uno `usuario`, uno `auditor`. El trigger les arma el perfil solo.
5. **Probar la seguridad (RLS)** entrando como cada rol: el docente solo ve sus salas, el alumno solo su progreso, el auditor lee todo sin poder escribir.
6. **Probar el flujo del código:** como admin, crear una sala (el `join_code` se autogenera); como alumno, llamar a la función `join_group('CÓDIGO')` y confirmar que queda inscrito.
7. **Generar el diagrama ER** (Supabase → Database → Schema Visualizer), exportarlo y guardarlo en `docs/`. Sirve directo para el entregable de Diagramación de BD (2FN).
8. **Escribir el "contrato" para el equipo** (sección 7): URL del proyecto, anon key, cómo registrarse/iniciar sesión, y las tablas y funciones que cada cliente va a usar, con ejemplos.
9. **Versionar el backend** en `backend/` del repo (el `.sql` y futuras migraciones), con commits `db:`.
10. **Decidir dos ajustes pendientes** (documentados en el `.sql`): si `player_responses` permite reintentos o una sola respuesta por pregunta, y cómo se controla la asignación de rol en el registro para producción.

Entregable de la Persona 1 = base de datos funcionando + diagrama ER + contrato publicado.

---

## 7. Contrato: qué entrega el backend a las Personas 2 y 3

Esto es lo que la Persona 1 debe dejar por escrito para desbloquear a las demás:

- **Acceso:** URL del proyecto Supabase + **anon key** (nunca la `service_role`). Los clientes no manejan seguridad: RLS ya la garantiza.
- **Auth:** cómo registrar un usuario (pasando `username`, `full_name` y `role` en los metadatos) y cómo iniciar sesión.
- **Para el Panel web (docente):** crear filas en `groups` (el código se autogenera), asignar reinos en `group_kingdoms`, crear `questions` + `question_options`, y leer `player_progress` / `player_responses` de sus salas para los reportes.
- **Para el Juego (alumno):** registro; unirse con `join_group('CÓDIGO')`; leer contenido (`kingdoms`, `levels`, `skills`, `questions`, `question_options`); y escribir `player_responses`, `player_progress` y `unlocked_skills`.

Con eso, las Personas 2 y 3 trabajan sin tocar la seguridad ni esperar más definiciones.

---

## 8. Cómo esto cubre los entregables de Desarrollo

- **README técnico** → README raíz del monorepo (pendiente).
- **Diagramación de BD (ER, 2FN)** → lo genera la Persona 1 en el paso 7.
- **Interfaces navegables con formularios funcionales** → panel web (Persona 2) + login/registro del juego (Persona 3).
- **Control de versiones** → monorepo con commits prefijados; cubre commit/push/pull.
- **Seguridad y 3 roles (admin/usuario/auditor)** → ya resuelto por el esquema y las políticas RLS.
- **Ejecución local + video** → build final y grabación del flujo completo (etapa de cierre).

---

## 9. Archivos ya generados

- `Propuesta_Humania_2reinos.docx` — la biblia de diseño reescrita a 2 reinos.
- `humania_backend.sql` — el backend completo listo para ejecutar en Supabase.
- Pendientes de generar: diagrama ER (paso 7), README raíz y `.gitignore` del repo.
