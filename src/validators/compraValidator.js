function validate(body) {
  const errors = [];
  const { fecha, detalles } = body;

  if (!fecha) {
    errors.push('La fecha es obligatoria');
  } else if (isNaN(Date.parse(fecha))) {
    errors.push('La fecha no tiene un formato válido (use YYYY-MM-DD)');
  }

  if (!Array.isArray(detalles) || detalles.length === 0) {
    errors.push('Debe incluir al menos un detalle de compra');
    return { valid: false, errors };
  }

  detalles.forEach((detalle, i) => {
    const pos = `detalles[${i}]`;

    if (!detalle.materia_prima_id || !Number.isInteger(Number(detalle.materia_prima_id)) || Number(detalle.materia_prima_id) <= 0) {
      errors.push(`${pos}: materia_prima_id debe ser un entero positivo`);
    }

    if (detalle.cantidad === undefined || detalle.cantidad === null) {
      errors.push(`${pos}: cantidad es obligatoria`);
    } else if (isNaN(Number(detalle.cantidad)) || Number(detalle.cantidad) <= 0) {
      errors.push(`${pos}: cantidad debe ser mayor a 0`);
    }

    if (detalle.precio_unitario === undefined || detalle.precio_unitario === null) {
      errors.push(`${pos}: precio_unitario es obligatorio`);
    } else if (isNaN(Number(detalle.precio_unitario)) || Number(detalle.precio_unitario) < 0) {
      errors.push(`${pos}: precio_unitario no puede ser negativo`);
    }
  });

  return { valid: errors.length === 0, errors };
}

module.exports = { validate };
