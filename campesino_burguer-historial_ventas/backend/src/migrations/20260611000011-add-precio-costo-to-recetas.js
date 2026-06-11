module.exports = {
  up: async (qi, Sq) => {
    await qi.addColumn('recetas', 'precio_venta', { type: Sq.DECIMAL(10, 2), defaultValue: 0, allowNull: false });
    await qi.addColumn('recetas', 'costo_produccion', { type: Sq.DECIMAL(10, 2), defaultValue: 0, allowNull: false });
  },
  down: async (qi) => {
    await qi.removeColumn('recetas', 'precio_venta');
    await qi.removeColumn('recetas', 'costo_produccion');
  },
};
