module.exports = {
  up: async (qi, Sq) => {
    await qi.createTable('ventas', {
      id: { type: Sq.INTEGER, primaryKey: true, autoIncrement: true },
      fecha: { type: Sq.DATEONLY, allowNull: false },
      cliente: { type: Sq.STRING(255) },
      total: { type: Sq.DECIMAL(12, 2), defaultValue: 0, allowNull: false },
      created_at: { type: Sq.DATE, allowNull: false },
      updated_at: { type: Sq.DATE, allowNull: false },
    });
  },
  down: async (qi) => qi.dropTable('ventas'),
};
