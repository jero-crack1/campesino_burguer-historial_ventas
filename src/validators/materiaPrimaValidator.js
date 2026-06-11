const UNIDADES_VALIDAS = ['kg', 'g', 'L', 'ml', 'cda', 'und'];

function validate(body, isUpdate = false) {
  const errors = [];
  const { nombre, unidad_medida, stock_actual, stock_minimo, costo_unitario } = body;

  if (!isUpdate) {
    if (!nombre || String(nombre).trim() === '') {
      errors.push('El nombre es obligatorio');
    }
    if (!unidad_medida) {
      errors.push('La unidad de medida es obligatoria');
    }
    if (costo_unitario === undefined || costo_unitario === null) {
      errors.push('El costo unitario es obligatorio');
    }
  }

  if (nombre !== undefined && String(nombre).trim() === '') {
    errors.push('El nombre no puede estar vacío');
  }

  if (unidad_medida !== undefined && !UNIDADES_VALIDAS.includes(unidad_medida)) {
    errors.push(`La unidad de medida debe ser una de: ${UNIDADES_VALIDAS.join(', ')}`);
  }

  if (stock_actual !== undefined) {
    const val = Number(stock_actual);
    if (isNaN(val) || val < 0) {
      errors.push('El stock actual debe ser un número mayor o igual a 0');
    }
  }

  if (stock_minimo !== undefined) {
    const val = Number(stock_minimo);
    if (isNaN(val) || val < 0) {
      errors.push('El stock mínimo debe ser un número mayor o igual a 0');
    }
  }

  if (costo_unitario !== undefined) {
    const val = Number(costo_unitario);
    if (isNaN(val) || val < 0) {
      errors.push('El costo unitario debe ser un número mayor o igual a 0');
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validate, UNIDADES_VALIDAS };
