require('./config/env').requireEnv('JWT_SECRET');

const express = require('express');
const path = require('path');
const sequelize = require('./config/database');

const requestLogger = require('./middlewares/requestLogger');
const sanitizeIds = require('./middlewares/sanitizeIds');
const { authJwt, requireRole, requireAdminForWrite } = require('./middlewares/auth');

const authRouter = require('./routes/auth');
const usersRouter = require('./routes/usuarios');
const categoriasRouter = require('./routes/categorias');
const productosRouter = require('./routes/productos');
const descuentosRouter = require('./routes/descuentos');
const clientesRouter = require('./routes/clientes');
const proveedoresRouter = require('./routes/proveedores');
const ventasRouter = require('./routes/ventas');
const detalleVentasRouter = require('./routes/detalleventas');
const detalleComprasRouter = require('./routes/detallecompras');
const comprasRouter = require('./routes/compras');
const faltantesRouter = require('./routes/faltantes');
const reportesRouter = require('./routes/reportes');

const app = express();

const API_PREFIX = '/Jeronimo Rubio_Sebastian Rocha_Ibrahim Safadi';
const ENCODED_API_PREFIX = '/Jeronimo%20Rubio_Sebastian%20Rocha_Ibrahim%20Safadi';
const LEGACY_API_PREFIX = '/JuanSebastianRocha Rodriguez_JeronimoRubio_Ibrahim Safadi';
const SIMPLE_API_PREFIX = '/api';

const apiPrefixes = [
  API_PREFIX,
  ENCODED_API_PREFIX,
  LEGACY_API_PREFIX,
  SIMPLE_API_PREFIX
];

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());
app.use(requestLogger);
app.use(sanitizeIds);
app.use(express.static(path.join(__dirname, '..')));

app.get([API_PREFIX, ENCODED_API_PREFIX], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'acceso-admin.html'));
});

app.get('/authors', (req, res) => {
  res.json({
    authors: [
      'Jeronimo Rubio',
      'sebastian rocha',
      'Ibrahim Safadi'
    ]
  });
});

async function health(req, res, next) {
  try {
    await sequelize.authenticate();
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

app.get(`${API_PREFIX}/health`, health);
app.get(`${ENCODED_API_PREFIX}/health`, health);
app.get(`${LEGACY_API_PREFIX}/health`, health);
app.get(`${SIMPLE_API_PREFIX}/health`, health);

function requireAdminForWriteWithAuth(req, res, next) {
  const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (!writeMethods.includes(req.method)) {
    return next();
  }

  return authJwt(req, res, () => requireAdminForWrite(req, res, next));
}

function mountApiRoutes(prefix) {
  app.use(`${prefix}/auth`, authRouter);

  app.use(`${prefix}/users`, authJwt, requireRole('ADMIN'), usersRouter);
  app.use(`${prefix}/usuarios`, authJwt, requireRole('ADMIN'), usersRouter);

  app.use(`${prefix}/categorias`, requireAdminForWriteWithAuth, categoriasRouter);
  app.use(`${prefix}/descuentos`, requireAdminForWriteWithAuth, descuentosRouter);
  app.use(`${prefix}/clientes`, requireAdminForWriteWithAuth, clientesRouter);
  app.use(`${prefix}/proveedores`, requireAdminForWriteWithAuth, proveedoresRouter);

  app.use(`${prefix}/compras`, authJwt, requireRole('ADMIN'), comprasRouter);
  app.use(`${prefix}/faltantes`, authJwt, requireRole('ADMIN'), faltantesRouter);
  app.use(`${prefix}/reportes`, authJwt, requireRole('ADMIN'), reportesRouter);

  app.use(`${prefix}/productos`, requireAdminForWriteWithAuth, productosRouter);
  app.use(`${prefix}/ventas`, ventasRouter);
  app.use(`${prefix}/detalle_ventas`, detalleVentasRouter);
  app.use(`${prefix}/detalleventas`, detalleVentasRouter);
  app.use(`${prefix}/detalle_compras`, detalleComprasRouter);
  app.use(`${prefix}/detallecompras`, detalleComprasRouter);
}

apiPrefixes.forEach(mountApiRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
