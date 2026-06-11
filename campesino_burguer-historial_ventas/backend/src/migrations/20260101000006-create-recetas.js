module.exports = {
  up: async (qi, Sq) => {
    await qi.createTable('recetas', {
      id: { type: Sq.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: Sq.STRING(150), allowNull: false },
      descripcion: { type: Sq.TEXT },
      unidad_produccion: { type: Sq.STRING(50), allowNull: false },
      cantidad_produccion: { type: Sq.DECIMAL(10, 3), allowNull: false, defaultValue: 1 },
      stock_actual: { type: Sq.DECIMAL(10, 3), defaultValue: 0, allowNull: false },
      created_at: { type: Sq.DATE, allowNull: false },
      updated_at: { type: Sq.DATE, allowNull: false },
    });
  },
  down: async (qi) => qi.dropTable('recetas'),
};
