# Humania

Videojuego educativo para la asignatura de **derechos y dignidad de la mujer** (derechos, prevención de violencia y equidad de género), dirigido a estudiantes y docentes de secundaria. Desarrollado para el reto **RETOS — Categoría Aficionado (Educación)**.

El jugador despierta en Humania sin memoria y debe recuperar los cristales de dos reinos —**Verde (Identidad)** y **Rojo (Derechos)**— comprendiendo y desarmando ideas dañinas (el estereotipo, la ignorancia), no derrotando personas.

---

## Descripción general

El sistema tiene dos clientes sobre un mismo backend:

- **Panel web (docente):** crea salas, asigna reinos como tarea, edita preguntas y consulta reportes. Sirve a los roles administrador y auditor.
- **Juego (Unity):** el alumno se registra, se une a una sala con un código y juega. Sirve al rol usuario.
- **Backend (Supabase):** autenticación y base de datos PostgreSQL con seguridad a nivel de fila (RLS). La seguridad vive en el backend; los clientes solo usan la clave pública (anon key).

Flujo principal: el docente crea una sala y obtiene un código único → lo comparte con su clase → el alumno entra al juego, se registra e ingresa el código → juega y su progreso queda registrado → el docente y el auditor lo ven como reportes.

---

## Stack / Tecnologías

| Capa | Tecnología |
|---|---|
| Juego | Unity (2D), C# — build Web (WebGL) y Android |
| Panel web | HTML, CSS, JavaScript |
| Backend | Supabase — Auth + PostgreSQL + RLS |
| Control de versiones | Git / GitHub (monorepo) |

---

## Estructura del repositorio

```
humania/
├── README.md            → este archivo
├── .gitignore           → reglas de Unity + web
├── backend/
│   └── humania_backend.sql   → esquema completo (tablas, RLS, funciones, semilla)
├── panel-web/           → panel del docente (HTML/JS)
├── juego-unity/         → proyecto Unity (Assets, ProjectSettings, Packages)
└── docs/                → diagrama ER, user flow, capturas (evidencia)
```

---

## Requisitos previos

- Cuenta de [Supabase](https://supabase.com)
- [Unity Hub](https://unity.com/download) + Unity 2D (versión LTS recomendada)
- Un navegador moderno para el panel web
- Git

---

## Instalación y ejecución

### 1. Backend (Supabase)

1. Crea un proyecto nuevo en Supabase.
2. Abre **SQL Editor** y ejecuta el contenido de `backend/humania_backend.sql` (crea tipos, tablas, índices, funciones, políticas RLS y datos semilla).
3. En **Authentication**, habilita el proveedor **Email**.
4. Copia la **URL del proyecto** y la **anon key** (Project Settings → API). Los clientes las necesitan. **Nunca** uses ni subas la `service_role`.

### 2. Panel web (docente)

1. Configura la URL del proyecto y la anon key (por ejemplo, en un archivo de configuración no versionado).
2. Sirve la carpeta `panel-web/` con cualquier servidor estático:
   ```bash
   cd panel-web
   npx serve .        # o: python -m http.server
   ```
3. Abre la dirección que indique la terminal en el navegador.

### 3. Juego (Unity)

1. En Unity Hub, **Add** → selecciona la carpeta `juego-unity/`.
2. Ábrelo y configura la URL del proyecto y la anon key en la escena/config correspondiente.
3. Pulsa **Play** para probar en el editor, o **Build** (WebGL o Android) para generar el ejecutable.

---

## Roles

El sistema define tres roles, alineados con el reto:

- **admin** — el docente: gestiona salas, asigna reinos y edita preguntas.
- **usuario** — el alumno: juega y su progreso se registra.
- **auditor** — solo lectura: revisa reportes sin poder modificar nada.

Los permisos se aplican con políticas RLS en la base de datos, no en los clientes.

---

## Convención de commits

Para mantener el historial legible, prefija cada commit por área:

- `db:` cambios en el backend / SQL
- `panel:` panel web del docente
- `juego:` proyecto Unity
- `docs:` documentación y evidencia

Ejemplo: `panel: formulario para crear sala`

---

## Equipo

- Persona 1 — Backend (Supabase)
- Persona 2 — Panel web (docente)
- Persona 3 — Juego (Unity)
