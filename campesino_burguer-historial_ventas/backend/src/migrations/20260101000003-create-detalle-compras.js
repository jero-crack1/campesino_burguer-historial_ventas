module.exports = {
  up: async (qi, Sq) => {
    await qi.createTable('detalle_compras', {
      id: { type: Sq.INTEGER, primaryKey: true, autoIncrement: true },
      compra_id: { type: Sq.INTEGER, allowNull: false, references: { model: 'compras', key: 'id' }, onDelete: 'CASCADE' },
      materia_prima_id: { type: Sq.INTEGER, allowNull: false, references: { model: 'materias_primas', key: 'id' } },
      cantidad: { type: Sq.DECIMAL(10, 3), allowNull: false },
      precio_unitario: { type: Sq.DECIMAL(12, 2), allowNull: false },
      subtotal: { type: Sq.DECIMAL(12, 2), allowNull: false },
      created_at: { type: Sq.DATE, allowNull: false },
      updated_at: { type: Sq.DATE, allowNull: false },
    });
    await qi.addIndex('detalle_compras', ['compra_id']);
    await qi.addIndex('detalle_compras', ['materia_prima_id']);
  },
  down: async (qi) => qi.dropTable('detalle_compras'),
};
