module.exports = {
  up: async (qi, Sq) => {
    await qi.createTable('materias_primas', {
      id: { type: Sq.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: Sq.STRING(150), allowNull: false },
      descripcion: { type: Sq.TEXT },
      unidad_medida: { type: Sq.STRING(50), allowNull: false },
      stock_actual: { type: Sq.DECIMAL(10, 3), defaultValue: 0, allowNull: false },
      stock_minimo: { type: Sq.DECIMAL(10, 3), defaultValue: 0, allowNull: false },
      precio_unitario: { type: Sq.DECIMAL(12, 2), defaultValue: 0, allowNull: false },
      created_at: { type: Sq.DATE, allowNull: false },
      updated_at: { type: Sq.DATE, allowNull: false },
    });
  },
  down: async (qi) => qi.dropTable('materias_primas'),
};
