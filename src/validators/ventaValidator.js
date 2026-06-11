function validate(body) {
  const errors = [];
  const { fecha, detalles } = body;

  if (!fecha) {
    errors.push('La fecha es obligatoria');
  } else if (isNaN(Date.parse(fecha))) {
    errors.push('La fecha no tiene un formato válido (use YYYY-MM-DD)');
  }

  if (!Array.isArray(detalles) || detalles.length === 0) {
    errors.push('Debe incluir al menos un detalle de venta');
    return { valid: false, errors };
  }

  detalles.forEach((detalle, i) => {
    const pos = `detalles[${i}]`;

    if (!detalle.receta_id || !Number.isInteger(Number(detalle.receta_id)) || Number(detalle.receta_id) <= 0) {
      errors.push(`${pos}: receta_id debe ser un entero positivo`);
    }

    if (detalle.cantidad === undefined || isNaN(Number(detalle.cantidad)) || Number(detalle.cantidad) <= 0) {
      errors.push(`${pos}: cantidad debe ser mayor a 0`);
    }
  });

  return { valid: errors.length === 0, errors };
}

module.exports = { validate };
