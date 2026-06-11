module.exports = {
  up: async (qi, Sq) => {
    await qi.createTable('compras', {
      id: { type: Sq.INTEGER, primaryKey: true, autoIncrement: true },
      proveedor: { type: Sq.STRING(150), allowNull: false },
      fecha: { type: Sq.DATEONLY, allowNull: false },
      notas: { type: Sq.TEXT },
      total: { type: Sq.DECIMAL(12, 2), defaultValue: 0, allowNull: false },
      created_at: { type: Sq.DATE, allowNull: false },
      updated_at: { type: Sq.DATE, allowNull: false },
    });
  },
  down: async (qi) => qi.dropTable('compras'),
};
