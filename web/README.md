# VMA Inmersiva 3D

Landing page de VMA Grupo Empresarial de Desarrollo e Innovación S.A.S. — Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4.

Ver **`AGENTS.md`** para las notas de arquitectura (sistema de auth/login, la página de precios + Wompi, el Attention Director del globo) — este README solo cubre cómo correr y desplegar el proyecto.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completar las variables que apliquen
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Ver `.env.example` para la lista completa y su documentación. Ninguna es obligatoria para levantar el sitio localmente — sin configurarlas, el formulario de contacto solo loguea en servidor y los botones de pago de `/precios` caen a un enlace de contacto en vez de un checkout real.

## Base de datos (login / `/portal`)

Usa `node:sqlite` (built-in de Node, sin dependencias) — el archivo vive en `data/app.db`, se crea solo, y está gitignored (contiene datos reales de usuarios). Para cargar la lista de usuarios aprobados desde un export de la hoja real de registros:

```bash
node scripts/import-users.mjs ruta/al/export.csv
```

## Build y despliegue

```bash
npm run build
```

En producción (VPS + PM2, no Vercel):

```bash
git pull origin main
cd web && npm install && npm run build
pm2 restart vma-inmersiva-3d   # nunca "pm2 restart all" — el VPS corre otros procesos
```
