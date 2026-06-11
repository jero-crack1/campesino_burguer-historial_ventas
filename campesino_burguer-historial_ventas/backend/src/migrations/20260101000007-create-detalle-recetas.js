module.exports = {
  up: async (qi, Sq) => {
    await qi.createTable('detalle_recetas', {
      id: { type: Sq.INTEGER, primaryKey: true, autoIncrement: true },
      receta_id: { type: Sq.INTEGER, allowNull: false, references: { model: 'recetas', key: 'id' }, onDelete: 'CASCADE' },
      tipo: { type: Sq.ENUM('materia_prima', 'sub_receta'), allowNull: false },
      materia_prima_id: { type: Sq.INTEGER, allowNull: true, references: { model: 'materias_primas', key: 'id' } },
      sub_receta_id: { type: Sq.INTEGER, allowNull: true, references: { model: 'sub_recetas', key: 'id' } },
      cantidad: { type: Sq.DECIMAL(10, 3), allowNull: false },
      created_at: { type: Sq.DATE, allowNull: false },
      updated_at: { type: Sq.DATE, allowNull: false },
    });
    await qi.addIndex('detalle_recetas', ['receta_id']);
  },
  down: async (qi) => qi.dropTable('detalle_recetas'),
};
