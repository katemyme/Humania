# Humania

Videojuego educativo para la asignatura de **derechos y dignidad de la mujer** (derechos, prevención de violencia y equidad de género), dirigido a estudiantes y docentes de secundaria. Desarrollado para el reto **RETOS — Categoría Aficionado (Educación)**: "Plataforma de aprendizaje basado en juegos".

El jugador despierta en Humania sin memoria y debe recuperar los **Cristales del Conocimiento** de dos reinos —**Verde (Identidad)** y **Rojo (Derechos)**— comprendiendo y desarmando ideas dañinas (el estereotipo, la ignorancia), no derrotando personas.

---

# ⚡ Prueba rápida

**No hace falta configurar nada ni crear una base de datos.** El panel y el juego ya apuntan a un backend de demostración funcionando. Solo se necesita **Node.js 18+** ([descargar](https://nodejs.org)).

### 1. Levantar el panel del docente (2 minutos)

```bash
git clone <url-del-repo>
cd humania/panel-web
npm install
npm run dev
```

Abre la dirección que aparece en la terminal (normalmente **http://localhost:5173**).

### 2. Crear una cuenta de docente

En la pantalla de login pulsa **«Crear cuenta»** y regístrate con:

| Campo | Qué poner |
|---|---|
| Nombre completo | El que quieras |
| Correo | Cualquiera, p. ej. `evaluador@humania.test` |
| Contraseña / Confirmar | **Mínimo 8 caracteres**, las dos iguales |
| **Código de institución** | **`MINED-2025`** |

> El código es lo que convierte la cuenta en docente (`admin`). Sin un código válido nadie puede entrar al panel: es la protección contra que cualquiera se registre como profesor.

### 3. Crear una sala y copiar su código

Ya dentro: **«Crear sala»** → escribe un nombre (p. ej. `Demo 3°A`) → la sala aparece con un **código de 6 caracteres**. Cópialo, lo necesitas para el juego.

Aquí ya puedes recorrer el panel: dashboard de salas, detalle de sala, editor de preguntas, reportes y exportación a CSV.

### 4. Entrar al juego como alumno

**Opción A — en el navegador (lo más rápido):**

> 🎮 **[Jugar Humania en el navegador](#)** ← *pendiente de publicar (ver «Publicar el build WebGL»)*

**Opción B — abrir el proyecto en Unity:**

1. Instala **Unity `6000.3.7f1`** desde Unity Hub.
2. Unity Hub → **Add** → selecciona la carpeta `juego-unity/`.
3. Abre la escena `Assets/Scenes/Login.unity` y pulsa **Play** (es la primera del build).

En cualquiera de las dos:

1. **Crear cuenta** → usuario y contraseña (mínimo 6 caracteres). El alumno **no da correo**: se le genera uno interno (`usuario@humania.local`) por privacidad de menores.
2. **Entrar** → usuario, contraseña y el **código de sala** del paso 3.
3. Ya dentro: pantalla de título → selector de mundos → **Bosque de la Empatía** (Reino Verde), con movimiento del personaje y menú de pausa (`Esc`).

### 5. Volver al panel

Refresca el panel: el alumno que acabas de crear aparece en la sala. Los reportes de progreso todavía salen vacíos porque **el juego aún no guarda avance** (ver «Estado actual»).

---

## Qué se puede evaluar hoy

| Requisito del reto | Dónde se ve |
|---|---|
| Interfaces navegables con formularios funcionales | Panel: login, registro, crear sala, editor de preguntas · Juego: login y registro |
| Base de datos (ER, normalizada) | `backend/humania_backend.sql` — 13 tablas |
| 3 roles y seguridad | `admin` / `usuario` / `auditor` con RLS en PostgreSQL |
| Control de versiones | Historial de este monorepo, commits con prefijo convencional |
| Ejecución local | Los pasos de arriba |

---

## Concepto y contenido

**Idea pedagógica central:** el enemigo nunca es una persona, es una *idea*. Los jefes no se derrotan a golpes: se comprenden y se desarman.

Esta entrega es un **vertical slice** de un proyecto de 5 reinos: implementa los dos primeros. Al recuperar sus dos cristales, Humania se restaura parcialmente y el jugador recuerda lo esencial de quién fue; el mundo queda abierto hacia los tres reinos restantes (Protección, Equidad y Futuro), que no forman parte de esta versión.

Cada reino se juega en tres capas: **plataformas** (estilo Mario), **puzzles narrativos** (estilo Undertale) y **colección** de fragmentos de saber con datos reales (estilo Pokémon). Cada reino otorga habilidades que se usan contra su jefe y quedan disponibles después.

| Reino | Eje temático | Jefe (idea) | Habilidades | Cristal |
|---|---|---|---|---|
| **Verde** | Identidad de género y autoconocimiento | El Estereotipo | Espejo de la Verdad · Voz Propia | Cristal de la Identidad |
| **Rojo** | Derechos de la mujer y marco legal | La Ignorancia | Memoria Legal · Cronología | Cristal de los Derechos |

- **El Estereotipo** es una torre de máscaras sin rostro propio. Se vence reflejando cada máscara con el *Espejo de la Verdad*: debajo aparece una persona real y diversa. Se disuelve al quedarse sin disfraces.
- **La Ignorancia** es una mancha que borra el texto de las leyes y oscurece la arena. Se vence reconstruyendo el Códice de los Derechos en orden con *Memoria Legal*; sin nada que borrar, se desvanece.

---

## Arquitectura

Dos clientes sobre un mismo backend. **La seguridad vive en el backend** (RLS en PostgreSQL); los clientes solo usan la clave pública (anon key).

- **`panel-web/`** — panel del docente (React + Vite). Roles **admin** (docente) y **auditor** (solo lectura).
- **`juego-unity/`** — el juego (Unity 6, 2D). Rol **usuario** (alumno).
- **`backend/`** — Supabase: Auth + PostgreSQL con RLS, funciones SQL y Edge Functions.

**Flujo principal:** el docente crea una sala y obtiene un código único → lo comparte con su clase → el alumno se registra en el juego e ingresa el código → juega y su progreso queda registrado → el docente y el auditor lo ven como reportes.

---

## Stack / Tecnologías

| Capa | Tecnología |
|---|---|
| Juego | Unity **6000.3.7f1** (2D URP), C# — build Web (WebGL) y Android |
| Panel web | React 18 · Vite 5 · React Router 6 · CSS Modules · `@supabase/supabase-js` |
| Backend | Supabase — Auth + PostgreSQL + RLS · funciones SQL · Edge Functions (Deno/TypeScript) |
| Control de versiones | Git / GitHub (monorepo) |

---

## Estructura del repositorio

```
humania/
├── README.md
├── .gitignore                         → reglas de Unity + web + secretos
├── backend/
│   ├── humania_backend.sql            → esquema completo (tablas, RLS, funciones, semilla)
│   ├── migrations/
│   │   ├── 0002_preguntas_por_sala.sql   → questions.group_id (preguntas propias por sala)
│   │   ├── 0003_registro_docentes.sql    → registro de docentes por código de institución
│   │   ├── 0004_blindar_rol.sql          → trigger que impide escalar profiles.role
│   │   └── 0005_acotar_lectura_profiles.sql → un docente solo ve a sus propios alumnos
│   ├── functions/
│   │   ├── registrar-docente/            → Edge Function pública: alta de docente con código
│   │   └── reset-student-password/       → Edge Function: el docente resetea la clave de un alumno
│   └── README.md
├── panel-web/                         → panel del docente (React + Vite)
│   ├── src/
│   │   ├── views/                     → Login, Register, Dashboard, SalaDetalle, AlumnoDetalle, Preguntas…
│   │   ├── components/                → header, botón, campo, chips, modal, toast, barra de progreso…
│   │   ├── hooks/                     → useSalas, usePreguntas, useReporteSala, useAlumnoReporte…
│   │   ├── data/api.js                → única puerta de entrada a los datos (Supabase)
│   │   └── supabaseClient.js          → conexión (con valores de demo por defecto)
│   ├── .env.example                   → solo si quieres apuntar a otro Supabase
│   └── package.json
├── juego-unity/                       → proyecto Unity (Assets, ProjectSettings, Packages)
│   └── Assets/
│       ├── Scenes/                    → Title_screen, World_Selector, Login, Sign_in, Worlds/Bosque_Empatia
│       ├── Scripts/                   → player_movement, menu_controller (pausa), load_scene
│       └── Supabase/                  → PantallaLogin, PantallaRegistro, SupabaseConfig, Sesion
└── docs/
    └── contrato-backend.md            → contrato de la API para panel y juego
```

---

## Modelo de datos (Supabase)

13 tablas normalizadas con RLS por rol. Recortar a 2 reinos no cambia el esquema: solo se pueblan 2 filas en `kingdoms`.

- **Cuentas y acceso:** `profiles`, `invitation_codes`
- **Contenido del juego:** `kingdoms`, `levels`, `skills`, `questions`, `question_options`
- **Salas (clases):** `groups` (el `join_code` se autogenera), `group_kingdoms`, `group_members`
- **Progreso del alumno:** `player_progress`, `player_responses`, `unlocked_skills`

Funciones SQL principales: `join_group('CÓDIGO')` (el alumno se inscribe en una sala), `handle_new_user` (crea el perfil al registrarse), `protect_profile_role` (blinda el rol), `consume_invitation_code` / `release_invitation_code`, `get_my_role`, `is_group_teacher`, `is_group_member`.

El contrato de la API para el equipo (tablas y funciones por cliente, ejemplos de las Edge Functions) está en **`docs/contrato-backend.md`**.

---

## Roles

- **admin** — el docente: gestiona salas, asigna reinos y edita preguntas.
- **usuario** — el alumno: juega y su progreso se registra.
- **auditor** — solo lectura: revisa reportes sin poder modificar nada.

Todo usuario nace con rol `usuario`; un docente solo se vuelve `admin` a través de la Edge Function `registrar-docente` con un código de institución válido. `profiles.role` no se puede cambiar desde ningún cliente. Los permisos se aplican con políticas RLS en la base de datos, no en los clientes.

---

## Montar tu propio backend (opcional)

Solo si no quieres usar el proyecto de demostración. Requiere la [Supabase CLI](https://supabase.com/docs/guides/cli).

1. Crea un proyecto nuevo en Supabase.
2. **SQL Editor** → ejecuta `backend/humania_backend.sql` completo.
3. Ejecuta las migraciones de `backend/migrations/` en orden numérico (`0002` → `0005`).
4. **Authentication** → habilita el proveedor **Email** y desactiva la confirmación por correo.
5. Despliega las Edge Functions:
   ```bash
   cd backend
   supabase functions deploy registrar-docente --no-verify-jwt
   supabase functions deploy reset-student-password
   ```
6. Copia `panel-web/.env.example` a `panel-web/.env.local` y pon tu URL y anon key.
7. Actualiza `juego-unity/Assets/Supabase/SupabaseConfig.cs` con los mismos valores.

**Nunca** uses ni subas la clave `service_role`: solo vive dentro de las Edge Functions.

---

## Publicar el build WebGL

Para que el evaluador juegue sin instalar Unity.

1. Unity Hub → tu instalación `6000.3.7f1` → engranaje → **Add modules** → marca **WebGL Build Support**.
2. Unity → **File → Build Profiles** → plataforma **Web** → **Switch Platform** → **Build**. Guarda la salida en una carpeta *fuera* del repo (p. ej. `build-web/`).
3. Sube esa carpeta a un hosting estático: [itch.io](https://itch.io) (la opción más simple para juegos), GitHub Pages o Netlify.
4. Pega el enlace en la sección **«⚡ Prueba rápida → paso 4, Opción A»** de este README.

Las escenas del build ya están configuradas en `ProjectSettings/EditorBuildSettings.asset`, con `Login` como primera: así el juego arranca pidiendo usuario, contraseña y código de sala, y el recorrido queda **Login → Título → Selector de mundos → Bosque de la Empatía**.

---

## Estado actual

- **Backend:** esquema completo, RLS por rol, migraciones y 2 Edge Functions. Desplegado y funcionando.
- **Panel web:** login y registro de docente, dashboard de salas, detalle de sala con tabla de alumnos, detalle por alumno, editor de preguntas por sala, vista de preguntas falladas y exportación a CSV. Conectado a Supabase.
- **Juego:** pantalla de título, selector de mundos, login y registro del alumno contra Supabase, ingreso a sala por código, menú de pausa, y el primer mundo (**Bosque de la Empatía / Reino Verde**) con personaje, movimiento, cámara, tilemaps y un nivel jugable.
- **Pendiente:** el juego todavía no escribe `player_progress` / `player_responses` / `unlocked_skills`, así que los reportes de avance del panel se muestran vacíos. Es la siguiente pieza para cerrar el ciclo completo.

---

## Convención de commits

Commits en español con prefijo convencional:

- `feat:` nueva funcionalidad
- `fix:` corrección de un error
- `chore:` mantenimiento, configuración, dependencias
- `docs:` documentación
- `refactor:`, `style:`, `db:` según corresponda

Ejemplo: `feat: formulario para crear sala`

---

## Equipo

- Sara Valeria Ruiz Castillo — Desarrolladora
- Larry Julián Conrado Delgadillo — Diseñador
- Xavier Alberto Larios Barberena — Comunicador
- Victor Mateo Alcocer Lopez — Desarrollador
- Mauro Engelbert Delgado Saenz — Desarrollador
