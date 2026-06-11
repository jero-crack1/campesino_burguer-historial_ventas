const AppError = require('../utils/AppError');

async function incrementarStock(materiaPrima, cantidad, transaction) {
  await materiaPrima.increment('stock_actual', { by: Number(cantidad), transaction });
}

async function validarYDescontarStock(materiaPrima, cantidad, transaction) {
  const stockActual = Number(materiaPrima.stock_actual);
  const cantidadNumerica = Number(cantidad);

  if (stockActual < cantidadNumerica) {
    throw new AppError(
      `Stock insuficiente para "${materiaPrima.nombre}": disponible ${stockActual}, requerido ${cantidadNumerica}`,
      400
    );
  }

  await materiaPrima.decrement('stock_actual', { by: cantidadNumerica, transaction });
}

module.exports = { incrementarStock, validarYDescontarStock };
