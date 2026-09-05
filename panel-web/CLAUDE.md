# Panel Docente Humania

## Stack
- React 18 + Vite 5
- React Router 6 — rutas: `/login`, `/salas`, `/salas/:id`
- CSS Modules + CSS variables globales (sin librería UI externa)
- JavaScript / JSX (sin TypeScript)
- Backend pendiente: Supabase — la capa de datos vive en `src/data/api.js`; cuando llegue el backend, solo hay que reemplazar el cuerpo de cada función por llamadas a Supabase sin tocar las vistas.

## Arquitectura de datos
`src/data/api.js` es la única puerta de entrada a los datos. Funciones async:
- `getSalas()` → lista de salas del docente
- `createSala(nombre)` → crea sala, devuelve la nueva
- `getSala(id)` → sala individual
- `getSalaAlumnos(id)` → alumnos de una sala con su progreso

Los mocks viven en `src/data/mock/` y se reemplazan conectando Supabase en `api.js`.

## Roles
- `'docente'` — acceso completo, puede crear salas.
- `'auditor'` — solo lectura: el botón "Crear sala" y el modal desaparecen completamente.
- Fuente de verdad: `useAuth().isAuditor` (AuthContext).
- Mock de login: cualquier email que contenga `auditor` asigna rol auditor; el resto es docente.

## Design Tokens — CSS variables en `src/styles/global.css`

### Colores
| Variable | Valor | Uso |
|---|---|---|
| `--color-azul` | `#2563EB` | Marca, header, barras de progreso |
| `--color-azul-oscuro` | `#1E3A8A` | Títulos, chip código, logo header |
| `--color-amarillo` | `#FDCD10` | CTA primario, avatar, logo interior |
| `--color-amarillo-hover` | `#f5c400` | Hover botón primario |
| `--color-amarillo-active` | `#e6b900` | Active botón primario |
| `--color-fondo` | `#F8FAFC` | Fondo de página y cards |
| `--color-blanco` | `#FFFFFF` | Inputs, superficie elevated |
| `--color-borde` | `#E2E8F0` | Bordes de cards e inputs |
| `--color-texto` | `#1E293B` | Texto principal |
| `--color-texto-secundario` | `#64748B` | Labels secundarios, subtítulos |
| `--color-placeholder` | `#94A3B8` | Placeholder de inputs |
| `--color-verde` | `#22C55E` | Barra progreso Reino Verde |
| `--color-verde-texto` | `#15803D` | Texto/número Reino Verde |
| `--color-verde-suave` | `#DCFCE7` | Badge Reino Verde |
| `--color-verde-fondo` | `#F0FDF4` | Filtro activo Reino Verde |
| `--color-rojo` | `#EF4444` | Barra progreso Reino Rojo |
| `--color-rojo-texto` | `#B91C1C` | Texto/número Reino Rojo |
| `--color-rojo-suave` | `#FEE2E2` | Badge Reino Rojo |
| `--color-rojo-fondo` | `#FEF2F2` | Filtro activo Reino Rojo |
| `--color-azul-badge` | `#DBEAFE` | Avatar alumno |
| `--color-azul-badge-fondo` | `#EFF6FF` | Filtro activo "Todos" |
| `--color-azul-badge-claro` | `#93C5FD` | Label "Código de sala" en chip |

### Tipografía
- **Quicksand** (500/600/700): títulos, botones, badges, números de stats, código de sala.
- **Open Sans** (400/600): cuerpo, subtítulos, labels secundarios.

### Border radius
| Variable | Valor | Dónde |
|---|---|---|
| `--radio-sm` | `12px` | Botones de filtro |
| `--radio-md` | `16px` | Botones primarios/outline |
| `--radio-lg` | `20px` | Tarjetas de stats, tabla, chip |
| `--radio-xl` | `28px` | Card de login |
| `--radio-pill` | `999px` | Badges, avatares, barras de progreso |

### Espaciado
- Padding header: `20px 40px`
- Padding main: `40px`
- Gap entre bloques principales: `16–40px`
- Padding interno de cards: `20–24px`

## Convenciones de código
- Sin estilos inline salvo valores 100% dinámicos (ej. `width: \`${pct}%\`` en ProgressBar).
- Un `.module.css` por componente; las CSS variables se referencian desde ahí.
- Hover/focus states solo en `.module.css`, nunca inline.
- Commits en español con prefijo convencional: `feat:`, `fix:`, `chore:`, `docs:`.
