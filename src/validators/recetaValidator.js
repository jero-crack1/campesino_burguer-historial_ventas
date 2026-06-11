const { UNIDADES_VALIDAS } = require('./materiaPrimaValidator');

function validate(body, isUpdate = false) {
  const errors = [];
  const { nombre, precio_venta, unidad_medida, stock_actual, costo_produccion, subrecetas, materias_primas } = body;

  if (!isUpdate) {
    if (!nombre || String(nombre).trim() === '') {
      errors.push('El nombre es obligatorio');
    }
    if (precio_venta === undefined || precio_venta === null) {
      errors.push('El precio de venta es obligatorio');
    }
    if (!unidad_medida) {
      errors.push('La unidad de medida es obligatoria');
    }
    const tieneSubrecetas = Array.isArray(subrecetas) && subrecetas.length > 0;
    const tieneMateriasPrimas = Array.isArray(materias_primas) && materias_primas.length > 0;
    if (!tieneSubrecetas && !tieneMateriasPrimas) {
      errors.push('La receta debe tener al menos una subreceta o una materia prima directa');
    }
  }

  if (nombre !== undefined && String(nombre).trim() === '') {
    errors.push('El nombre no puede estar vacío');
  }

  if (precio_venta !== undefined && (isNaN(Number(precio_venta)) || Number(precio_venta) < 0)) {
    errors.push('El precio de venta debe ser un número mayor o igual a 0');
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

  if (Array.isArray(subrecetas)) {
    subrecetas.forEach((s, i) => {
      const pos = `subrecetas[${i}]`;
      if (!s.subreceta_id || !Number.isInteger(Number(s.subreceta_id)) || Number(s.subreceta_id) <= 0) {
        errors.push(`${pos}: subreceta_id debe ser un entero positivo`);
      }
      if (s.cantidad === undefined || isNaN(Number(s.cantidad)) || Number(s.cantidad) <= 0) {
        errors.push(`${pos}: cantidad debe ser mayor a 0`);
      }
    });
  }

  if (Array.isArray(materias_primas)) {
    materias_primas.forEach((m, i) => {
      const pos = `materias_primas[${i}]`;
      if (!m.materia_prima_id || !Number.isInteger(Number(m.materia_prima_id)) || Number(m.materia_prima_id) <= 0) {
        errors.push(`${pos}: materia_prima_id debe ser un entero positivo`);
      }
      if (m.cantidad === undefined || isNaN(Number(m.cantidad)) || Number(m.cantidad) <= 0) {
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
