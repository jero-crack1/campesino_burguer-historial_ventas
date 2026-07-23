// Precio de venta real de una Receta en este momento: el promocional si la promoción
// está vigente (activa y dentro del rango de fechas), o el normal en cualquier otro caso.
function precioEfectivo(receta) {
  const precioVenta = parseFloat(receta.precio_venta);
  if (!receta.en_promocion || receta.precio_promocion == null) return precioVenta;

  const hoy = new Date().toISOString().slice(0, 10);
  if (receta.promocion_desde && hoy < receta.promocion_desde) return precioVenta;
  if (receta.promocion_hasta && hoy > receta.promocion_hasta) return precioVenta;

  return parseFloat(receta.precio_promocion);
}

module.exports = { precioEfectivo };
