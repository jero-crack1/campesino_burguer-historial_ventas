module.exports = {
  up: async (qi, Sq) => {
    await qi.addColumn('detalle_compras', 'costo_paquete', {
      type: Sq.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: null,
    });
    await qi.addColumn('detalle_compras', 'cantidad_paquete', {
      type: Sq.DECIMAL(10, 3),
      allowNull: true,
      defaultValue: null,
    });
  },
  down: async (qi) => {
    await qi.removeColumn('detalle_compras', 'costo_paquete');
    await qi.removeColumn('detalle_compras', 'cantidad_paquete');
  },
};
