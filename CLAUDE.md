# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

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
```

`src/config/env.js` implements its own `.env` loader — there is no `dotenv` dependency.

## Architecture

This is an Express REST API for a burger restaurant's sales history system, with static HTML frontends served from the project root.

### Data Layer

All persistent data is stored as **JSON files in `data/`** (e.g., `data/ventas.json`, `data/productos.json`). Despite Sequelize being installed, it is only used for a health check — the actual data layer is `src/utils/dataStore.js`, which reads and writes JSON files synchronously.

`src/routes/createResourceRouter.js` is a factory that creates full CRUD routers (GET list, GET by id, POST, PUT, DELETE) backed by `dataStore`. Most routes (`categorias`, `clientes`, `proveedores`, `compras`, `faltantes`, `descuentos`, `detalleventas`, `detallecompras`, `reportes`, `usuarios`) are just `module.exports = createResourceRouter('nombre')`.

The exceptions with custom logic are:
- `src/routes/productos.js` — validates category, normalizes fields, handles `seguimientoInventario` flag
- `src/routes/ventas.js` — deducts stock from `productos` records when a sale is posted; supports both single-item and multi-item (`items[]`) body formats
- `src/routes/auth.js` — single admin login endpoint; issues JWT valid for 8h

### API Prefixes

The same routes are mounted under four prefixes simultaneously (see `src/app.js`):
- `/Jeronimo Rubio_Sebastian Rocha_Ibrahim Safadi` (primary)
- `/api` (simple alias)
- `/JuanSebastianRocha Rodriguez_JeronimoRubio_Ibrahim Safadi` (legacy)
- URL-encoded variant of the primary prefix

Use `/api` for local development and testing.

### Auth Model

- One hardcoded admin user (from env vars `ADMIN_USER` / `ADMIN_PASSWORD`), role `ADMIN`
- `POST /api/auth/login` returns a JWT bearer token
- `authJwt` middleware validates the token; `requireRole('ADMIN')` gates write access
- `requireAdminForWriteWithAuth` — a helper that skips auth for GET/HEAD but enforces ADMIN for mutating methods. Used on `categorias`, `descuentos`, `clientes`, `proveedores`, `productos`
- `ventas` routes have **no auth requirement** at all (public endpoint)

### Frontend

Static HTML files at the project root are served by Express:
- `acceso-admin.html` — admin login page (served at the primary API prefix path)
- `admin.html` + `admin.js` + `admin.css` — admin panel
- `ventas.html` + `ventas.js` — sales UI
- `factura.html` — invoice view
# Contexto General del Proyecto

## Objetivo

Este proyecto evolucionará hacia una plataforma completa de gestión de inventario, producción y ventas para productos alimenticios.

El flujo principal del negocio es:

Compras → Materias Primas → Subrecetas → Recetas → Ventas

Todas las funcionalidades futuras deben respetar este flujo.

---

## Tecnologías Objetivo

Backend:

* Node.js
* Express.js
* Sequelize ORM
* MySQL

Frontend:

* HTML
* CSS
* JavaScript

---

## Arquitectura

El proyecto debe seguir arquitectura por capas:

* Routes
* Controllers
* Services
* Models
* Migrations
* Validators
* Middlewares

---

## Reglas de Desarrollo

Toda la lógica de negocio debe implementarse en Services.

Los Controllers únicamente deben:

* Recibir requests.
* Validar datos.
* Invocar servicios.
* Retornar respuestas.

Los Controllers nunca deben contener lógica de negocio compleja.

---

## Reglas de Inventario

El inventario SOLO puede modificarse mediante:

* Compras.
* Producción de Subrecetas.
* Producción de Recetas.
* Ventas.

La creación o edición de recetas NO modifica inventario.

La creación o edición de subrecetas NO modifica inventario.

Las recetas y subrecetas representan fórmulas de producción.

---

## Reglas Técnicas

* Utilizar Sequelize para nuevas entidades.
* Utilizar migraciones.
* Utilizar asociaciones Sequelize.
* Utilizar transacciones en operaciones críticas.
* Evitar código duplicado.
* Seguir principios SOLID.
* Mantener separación clara de responsabilidades.

---

## Instrucciones para Claude

Antes de realizar cambios importantes:

1. Analizar la arquitectura existente.
2. Proponer un plan de implementación.
3. Reutilizar componentes existentes.
4. Evitar duplicación de lógica.
5. Mantener consistencia en toda la aplicación.
6. Explicar riesgos antes de cambios estructurales.
