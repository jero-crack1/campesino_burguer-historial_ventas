const {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
} = require('sequelize');

function errorHandler(err, req, res, next) {
  if (err instanceof ValidationError) {
    return res.status(422).json({
      ok: false,
      error: 'Error de validación',
      details: err.errors.map((e) => e.message),
    });
  }

  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({ ok: false, error: 'El recurso ya existe' });
  }

  if (err instanceof ForeignKeyConstraintError) {
    return res.status(409).json({
      ok: false,
      error: 'El recurso referenciado no existe o está en uso',
    });
  }

  const status = err.status || 500;
  res.status(status).json({ ok: false, error: err.message || 'Error interno del servidor' });
}

module.exports = errorHandler;
