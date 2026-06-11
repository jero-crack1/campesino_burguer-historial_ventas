# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### New System

```bash
# Backend (puerto 4000)
cd campesino_burguer-historial_ventas/backend
npm install
cp .env.example .env        # Set DATABASE_URL with Neon connection string
npm run db:migrate           # Run Sequelize migrations against Neon
npm run dev                  # Dev with nodemon

# Frontend (puerto 5173)
cd campesino_burguer-historial_ventas/frontend
npm install
cp .env.example .env        # Set VITE_API_URL=http://localhost:4000/api
npm run dev
npm run build               # Build for Render deploy
```

### Legacy System

```bash
# Install dependencies
npm install

# Start the server (production and dev use the same command)
npm start

# Server runs at http://localhost:3000 by default
```

## Environment Setup

Copy `.env.example` to `.env` and set values before starting:

```
JWT_SECRET=change-this-secret
ADMIN_USER=admin
ADMIN_PASSWORD=admin
DATABASE_URL=          # optional: set to a MySQL connection string to switch from SQLite
```

`src/config/env.js` implements its own `.env` loader — there is no `dotenv` dependency.

## Architecture

This repository contains two separate applications and the legacy Express system.

### New System (active development)

| | Path | Stack |
|---|---|---|
| **Backend** | `campesino_burguer-historial_ventas/backend/` | Express + Sequelize + PostgreSQL (Neon) |
| **Frontend** | `campesino_burguer-historial_ventas/frontend/` | React 18 + Vite + Tailwind CSS + Shadcn/UI |
| **Deploy** | `render.yaml` | Render (API = Web Service, Frontend = Static Site) |

### Legacy System (do not extend)

This is an Express REST API for a burger restaurant's sales and inventory system, with static HTML frontends served from the project root. There are **no automated tests**.

### Current State vs. Target Architecture

**Current state:** flat Express routes writing to JSON files, no controllers or services layer.

**Target architecture** (new features must follow this): layered structure — Routes → Controllers → Services → Models/Migrations — backed by **Sequelize + MySQL**. Business logic belongs exclusively in Services; Controllers only receive, validate, and respond.

`src/config/database.js` already supports both: SQLite by default, MySQL when `DATABASE_URL` is set.

### Data Layer (current)

All persistent data is stored as **JSON files in `data/`** (e.g., `data/ventas.json`, `data/productos.json`). The actual data layer is `src/utils/dataStore.js`, which reads and writes JSON files synchronously with auto-incrementing IDs.

`src/routes/createResourceRouter.js` is a factory that creates full CRUD routers (GET list, GET by id, POST, PUT, DELETE) backed by `dataStore`. Most routes (`clientes`, `proveedores`, `faltantes`, `descuentos`, `detalleventas`, `detallecompras`, `reportes`, `usuarios`) are just `module.exports = createResourceRouter('nombre')`.

The routes with **custom business logic** are:
- `src/routes/productos.js` — validates category exists, normalizes fields, handles `seguimientoInventario` flag
- `src/routes/ventas.js` — **deducts** stock from `productos` on POST; supports single-item and multi-item (`items[]`) body formats
- `src/routes/compras.js` — **adds** stock to `productos` when a purchase is recorded
- `src/routes/categorias.js` — seeds four default categories (Hamburguesas, Bebidas, Acompañamientos, Combos) if `data/categorias.json` is empty
- `src/routes/auth.js` — single admin login endpoint; issues JWT valid for 8h

### Inventory Rules

Stock can **only** be modified by: Compras (add), Ventas (deduct), Producción de Subrecetas, Producción de Recetas. Creating or editing a recipe/sub-recipe never touches stock.

### API Prefixes

The same routes are mounted under four prefixes simultaneously (see `src/app.js`):
- `/api` — use this for local development and testing
- `/Jeronimo Rubio_Sebastian Rocha_Ibrahim Safadi` (primary)
- `/JuanSebastianRocha Rodriguez_JeronimoRubio_Ibrahim Safadi` (legacy)
- URL-encoded variant of the primary prefix

### Auth Model

- One hardcoded admin user (env vars `ADMIN_USER` / `ADMIN_PASSWORD`), role `ADMIN`
- `POST /api/auth/login` returns a JWT bearer token
- `src/middlewares/auth.js` exports: `authJwt` (validates token), `requireRole('ADMIN')` (gates by role), `requireAdminForWriteWithAuth` (skips auth on GET/HEAD, enforces ADMIN on mutating methods — used on `categorias`, `descuentos`, `clientes`, `proveedores`, `productos`)
- `src/middlewares/sanitizeIds.js` — rejects non-numeric `:id` params before they reach any route handler
- `ventas` routes have **no auth requirement** (public endpoint)

### Frontend

Static HTML files at the project root are served by Express:
- `acceso-admin.html` — admin login/landing page
- `admin.html` + `admin.js` + `admin.css` — inventory management panel
- `ventas.html` + `ventas.js` — POS (point-of-sale) interface with cart, payment, and paused-sales support
- `factura.html` — invoice view
- `backend.js` — shared fetch wrapper (`window.Backend.get()` / `window.Backend.post()`) used by all frontend pages; all API calls go through this utility

---

# Contexto General del Proyecto

## Objetivo

Este proyecto evolucionará hacia una plataforma completa de gestión de inventario, producción y ventas para productos alimenticios.

El flujo principal del negocio es:

Compras → Materias Primas → Subrecetas → Recetas → Ventas

Todas las funcionalidades futuras deben respetar este flujo.

---

## Tecnologías Objetivo

Backend: Node.js · Express.js · Sequelize ORM · MySQL

Frontend: HTML · CSS · JavaScript

---

## Reglas de Desarrollo

Toda la lógica de negocio debe implementarse en Services.

Los Controllers únicamente deben:
- Recibir requests.
- Validar datos.
- Invocar servicios.
- Retornar respuestas.

---

## Reglas Técnicas

- Utilizar Sequelize para nuevas entidades.
- Utilizar migraciones.
- Utilizar asociaciones Sequelize.
- Utilizar transacciones en operaciones críticas.
- Seguir principios SOLID y mantener separación clara de responsabilidades.

---

## Instrucciones para Claude

Antes de realizar cambios importantes:

1. Analizar la arquitectura existente.
2. Proponer un plan de implementación.
3. Reutilizar componentes existentes.
4. Evitar duplicación de lógica.
5. Mantener consistencia en toda la aplicación.
6. Explicar riesgos antes de cambios estructurales.
Proyecto: Sistema de Producción Alimentaria

Objetivo

Desarrollar un sistema web para la gestión de producción alimentaria utilizando:

* React
* TailwindCSS
* Shadcn/UI
* React Router
* Axios
* React Hook Form
* Zod
* Node.js
* Express
* Sequelize
* PostgreSQL (Neon)
* Render

Alcance del proyecto

Este proyecto NO incluye:

* Ventas
* Dashboard analítico avanzado
* Reportes financieros
* JWT
* Roles
* Gestión de usuarios
* Fotos de productos vendidos

Esos módulos serán desarrollados posteriormente por otros integrantes.

Alcance actual

El sistema debe permitir:

1. Gestión de Materias Primas.
2. Gestión de Compras.
3. Gestión de SubRecetas.
4. Producción de SubRecetas.
5. Gestión de Recetas.
6. Producción de Recetas.

Flujo de negocio

Compras
→ Materias Primas
→ Producción SubRecetas
→ SubRecetas
→ Producción Recetas
→ Recetas

Reglas de inventario

Materias Primas

Aumentan únicamente mediante Compras.

Disminuyen mediante:

* Producción de SubRecetas
* Producción de Recetas

SubRecetas

No generan movimientos al crearse o editarse.

Aumentan mediante:

* Producción de SubRecetas

Disminuyen mediante:

* Producción de Recetas

Recetas

No generan movimientos al crearse o editarse.

Aumentan mediante:

* Producción de Recetas

Arquitectura Backend

src/

config/
models/
controllers/
services/
routes/
middlewares/
validators/
utils/

Arquitectura Frontend

src/

layouts/
pages/
components/
services/
hooks/
routes/
styles/

Estándares Backend

* Controladores delgados.
* Lógica únicamente en Services.
* Validaciones separadas.
* Manejo centralizado de errores.
* Uso de transacciones Sequelize para operaciones de inventario.
* No duplicar lógica.

Estándares Frontend

* Componentes reutilizables.
* Formularios con React Hook Form.
* Validaciones con Zod.
* Axios para consumo API.
* Shadcn/UI para componentes visuales.
* TailwindCSS para estilos.

Componentes reutilizables obligatorios

* AppSidebar
* PageHeader
* DataTable
* FormModal
* ConfirmDialog
* LoadingSpinner
* EmptyState

Convenciones

Antes de implementar cualquier fase:

1. Explicar el plan.
2. Explicar archivos afectados.
3. Explicar cambios en Backend.
4. Explicar cambios en Frontend.
5. Implementar.
6. Mostrar estructura final.

No generar código redundante.

Priorizar reutilización de componentes.

Mantener escalabilidad para futuras fases.