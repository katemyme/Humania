# Backend — Humania (Supabase)

## Contenido
- `humania_backend.sql` — esquema completo: tablas, índices, funciones, RLS y datos semilla.
- `migrations/` — cambios incrementales del esquema.

## Puesta en marcha
1. Crear un proyecto en Supabase.
2. SQL Editor → ejecutar `humania_backend.sql` completo.
3. Authentication → habilitar el proveedor Email.
4. Crear usuarios de prueba (admin, usuario, auditor) pasando `role` en los metadatos.
5. Probar las políticas RLS y el flujo de `join_group('CODIGO')`.
6. Generar el diagrama ER (Database → Schema Visualizer) y guardarlo en `docs/`.
7. Completar `docs/contrato-backend.md` para el equipo.
