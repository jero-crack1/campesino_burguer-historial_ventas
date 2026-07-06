const errorHandler = (err, _req, res, _next) => {
  const status = err.status || 500;
  if (status === 500) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
  res.status(status).json({ error: err.message || 'Error interno del servidor' });
};

module.exports = errorHandler;
