const { UNIDADES_VALIDAS } = require('./materiaPrimaValidator');

function validate(body, isUpdate = false) {
  const errors = [];
  const { nombre, unidad_medida, stock_actual, costo_produccion, ingredientes } = body;

  if (!isUpdate) {
    if (!nombre || String(nombre).trim() === '') {
      errors.push('El nombre es obligatorio');
    }
    if (!unidad_medida) {
      errors.push('La unidad de medida es obligatoria');
    }
    if (!Array.isArray(ingredientes) || ingredientes.length === 0) {
      errors.push('Debe incluir al menos un ingrediente');
    }
  }

  if (nombre !== undefined && String(nombre).trim() === '') {
    errors.push('El nombre no puede estar vacío');
  }

  if (unidad_medida !== undefined && !UNIDADES_VALIDAS.includes(unidad_medida)) {
    errors.push(`La unidad de medida debe ser una de: ${UNIDADES_VALIDAS.join(', ')}`);
  }

  if (stock_actual !== undefined && (isNaN(Number(stock_actual)) || Number(stock_actual) < 0)) {
    errors.push('El stock actual debe ser un número mayor o igual a 0');
  }

  if (costo_produccion !== undefined && (isNaN(Number(costo_produccion)) || Number(costo_produccion) < 0)) {
    errors.push('El costo de producción debe ser un número mayor o igual a 0');
  }

  if (Array.isArray(ingredientes)) {
    ingredientes.forEach((ing, i) => {
      const pos = `ingredientes[${i}]`;
      if (!ing.materia_prima_id || !Number.isInteger(Number(ing.materia_prima_id)) || Number(ing.materia_prima_id) <= 0) {
        errors.push(`${pos}: materia_prima_id debe ser un entero positivo`);
      }
      if (ing.cantidad === undefined || isNaN(Number(ing.cantidad)) || Number(ing.cantidad) <= 0) {
        errors.push(`${pos}: cantidad debe ser mayor a 0`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

function validateProduccion(body) {
  const errors = [];
  const { cantidad_producir } = body;

  if (cantidad_producir === undefined || cantidad_producir === null) {
    errors.push('cantidad_producir es obligatorio');
  } else if (isNaN(Number(cantidad_producir)) || Number(cantidad_producir) <= 0) {
    errors.push('cantidad_producir debe ser mayor a 0');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validate, validateProduccion };
