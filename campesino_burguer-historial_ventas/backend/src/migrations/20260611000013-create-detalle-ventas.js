module.exports = {
  up: async (qi, Sq) => {
    await qi.createTable('detalle_ventas', {
      id: { type: Sq.INTEGER, primaryKey: true, autoIncrement: true },
      venta_id: { type: Sq.INTEGER, allowNull: false, references: { model: 'ventas', key: 'id' }, onDelete: 'CASCADE' },
      receta_id: { type: Sq.INTEGER, allowNull: false, references: { model: 'recetas', key: 'id' } },
      cantidad: { type: Sq.DECIMAL(10, 3), allowNull: false },
      precio_unitario: { type: Sq.DECIMAL(10, 2), allowNull: false },
      subtotal: { type: Sq.DECIMAL(12, 2), allowNull: false },
      created_at: { type: Sq.DATE, allowNull: false },
      updated_at: { type: Sq.DATE, allowNull: false },
    });
  },
  down: async (qi) => qi.dropTable('detalle_ventas'),
};
