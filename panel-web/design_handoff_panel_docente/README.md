# Handoff: Panel Docente Humania

## Overview
Panel web para docentes del videojuego educativo Humania. El docente (roles: administrador/docente y auditor de solo lectura) crea "salas" con un código único que comparten con sus alumnos, asigna reinos (Verde y Rojo) y revisa el avance de sus alumnos.

## About the Design Files
Los archivos de este paquete son **referencias de diseño creadas en HTML** (Design Components) — prototipos que muestran el look final y el comportamiento esperado, no código de producción para copiar tal cual. La tarea es **recrear estos diseños HTML en el entorno del codebase destino** (React, Vue, etc., según lo que ya use el proyecto, o el framework más adecuado si no existe uno aún), aplicando los patrones y librerías establecidos ahí.

## Fidelity
**Alta fidelidad (hifi)**: mockups con colores, tipografía, espaciados e interacciones finales. El desarrollador debe recrear la UI con fidelidad pixel-perfect usando las librerías del codebase existente.

## Screens / Views

### 1. Login (Login.dc.html)
- **Propósito**: autenticación del docente.
- **Layout**: pantalla centrada, fondo azul de marca #2563EB a pantalla completa. Card blanco (#F8FAFC) centrado, max-width 420px, border-radius 28px, padding 48px 40px.
- **Componentes**:
  - Logo: cuadrado 72×72px, fondo #2563EB, border-radius 20px, con un cuadrado interior 30×30px amarillo #FDCD10 centrado.
  - Título "Humania": Quicksand 700, 28px, color #1E3A8A.
  - Subtítulo "Panel docente": Open Sans 15px, color #64748B.
  - Campo Email: label Quicksand 600 14px color #1E3A8A; input h:52px, border-radius 14px, border 2px #E2E8F0, placeholder "docente@escuela.edu".
  - Campo Contraseña: mismo estilo, tipo password, placeholder "••••••••".
  - Focus de inputs: borde #FDCD10 + halo amarillo suave (box-shadow rgba(253,205,16,0.35)).
  - Botón "Iniciar sesión": full width, h:54px, border-radius 16px, fondo #FDCD10, texto Quicksand 700 17px color #1E3A8A. Hover: #f5c400. Active: #e6b900.
  - Enlace "¿Olvidaste tu contraseña?": Open Sans 14px, color #1E3A8A, sin subrayado, hover más oscuro.

### 2. Dashboard de salas (Dashboard.dc.html)
- **Propósito**: listar y crear salas, ver métricas generales.
- **Layout**: header azul (#2563EB) fijo arriba con logo + badge de rol + avatar. Main con max-width 1200px centrado, padding 40px.
- **Componentes**:
  - Header: logo igual que login (versión pequeña 44×44px); badge de rol (Docente = fondo #FDCD10; Auditor = fondo #E2E8F0, texto "Auditor · solo lectura"); avatar circular 40×40px con iniciales.
  - Título "Mis salas" (Quicksand 700 30px, #1E3A8A) + subtítulo descriptivo.
  - Botón "+ Crear sala" (visible solo si NO es auditor): fondo #FDCD10, h:52px, border-radius 16px, texto Quicksand 700 16px #1E3A8A.
  - 3 tarjetas de estadísticas generales (Salas activas, Alumnos totales, Avance promedio): fondo blanco, border 2px #E2E8F0, border-radius 20px, número grande Quicksand 700 28px #1E3A8A.
  - Grid de tarjetas de sala (auto-fill, min 320px): cada tarjeta con:
    - Nombre de sala + grado.
    - Chips de reino asignado: Reino Verde (fondo #DCFCE7, texto #15803D), Reino Rojo (fondo #FEE2E2, texto #B91C1C).
    - Chip de código de sala: fondo #1E3A8A, texto código Quicksand 700 20px #F8FAFC con letter-spacing, botón "Copiar" en amarillo #FDCD10 — click copia al portapapeles y muestra un toast.
    - Barra de progreso: fondo #E2E8F0, relleno #2563EB, con texto "% avance" y "N alumnos".
    - Botón "Ver detalle": outline azul, fondo #F8FAFC, texto #2563EB, border 2px #DBEAFE.
  - Modal "Crear nueva sala": overlay rgba(30,58,138,0.45), card blanco border-radius 24px, campo nombre, botones Cancelar/Crear.
  - Toast de confirmación: fondo #1E3A8A, texto blanco, centrado abajo, fixed.

### 3. Detalle de sala + reportes (SalaDetalle.dc.html)
- **Propósito**: ver métricas y progreso por alumno dentro de una sala específica.
- **Layout**: mismo header que el dashboard. Debajo, link "← Volver a mis salas", encabezado de sala con nombre/grado y chip de código con botón copiar.
- **Componentes**:
  - 4 tarjetas de stats: Alumnos, Avance Reino Verde (#15803D), Avance Reino Rojo (#B91C1C), Alumnos que completaron ambos reinos.
  - Filtros por pestaña: Todos / Reino Verde / Reino Rojo (botones toggle con borde y fondo de color según selección) + input de búsqueda por nombre.
  - Tabla de alumnos: columnas Alumno (avatar iniciales + nombre), Reino Verde (barra verde #22C55E + %), Reino Rojo (barra roja #EF4444 + %), Última actividad. Fila con hover gris claro (#F1F5F9).
  - Estado vacío: "No se encontraron alumnos." centrado, gris.

## Interactions & Behavior
- Login: submit de formulario (sin backend conectado en el prototipo); inputs controlados.
- Dashboard: crear sala genera código aleatorio con prefijo "HUM-"; copiar código dispara toast por 2s; el botón "Crear sala" y el modal se ocultan completamente para el rol auditor (solo lectura).
- Detalle de sala: filtros y búsqueda combinables (client-side filter); copiar código de sala.
- Sin animaciones complejas; transiciones simples de hover/focus.

## State Management
- Login: `email`, `password` (estado local de formulario).
- Dashboard: `role` ('docente' | 'auditor'), `salas` (lista), `toast` (mensaje temporal), `showCreate` (modal), `newSalaName`.
- Detalle de sala: `role`, `filter` ('todos' | 'verde' | 'rojo'), `search`.
- Datos de alumnos/salas son mock en el prototipo — en producción deben venir de la API real (salas, alumnos, progreso por reino).

## Design Tokens
- **Colores**: Azul marca #2563EB · Amarillo #FDCD10 · Azul oscuro #1E3A8A · Blanco/fondo #F8FAFC · Bordes neutros #E2E8F0 · Texto secundario #64748B · Texto principal #1E293B · Verde éxito #22C55E/#15803D/#DCFCE7/#F0FDF4 · Rojo #EF4444/#B91C1C/#FEE2E2/#FEF2F2 · Azul claro badges #DBEAFE/#EFF6FF/#93C5FD.
- **Tipografía**: Quicksand (500/600/700) para títulos y elementos destacados; Open Sans (400/600) para cuerpo y labels.
- **Border radius**: 12–16px en botones/inputs, 20–28px en tarjetas y modales, 999px (pill) en badges/avatares/barras de progreso.
- **Espaciado**: gaps de 16–40px entre bloques principales; padding interno de tarjetas 20–24px.
- **Estilo general**: plano, sin degradados ni sombras marcadas, bordes de 2px como único recurso de separación visual.

## Assets
No se usan imágenes externas; el logo es geométrico (cuadrado azul + cuadrado amarillo interior), generado con divs, sin archivos de imagen.

## Files
- `Login.dc.html`
- `Dashboard.dc.html`
- `SalaDetalle.dc.html`
- `support.js` (runtime del prototipo, no relevante para la implementación final)
