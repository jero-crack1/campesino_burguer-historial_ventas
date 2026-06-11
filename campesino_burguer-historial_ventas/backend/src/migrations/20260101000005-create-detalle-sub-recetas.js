module.exports = {
  up: async (qi, Sq) => {
    await qi.createTable('detalle_sub_recetas', {
      id: { type: Sq.INTEGER, primaryKey: true, autoIncrement: true },
      sub_receta_id: { type: Sq.INTEGER, allowNull: false, references: { model: 'sub_recetas', key: 'id' }, onDelete: 'CASCADE' },
      materia_prima_id: { type: Sq.INTEGER, allowNull: false, references: { model: 'materias_primas', key: 'id' } },
      cantidad: { type: Sq.DECIMAL(10, 3), allowNull: false },
      created_at: { type: Sq.DATE, allowNull: false },
      updated_at: { type: Sq.DATE, allowNull: false },
    });
    await qi.addIndex('detalle_sub_recetas', ['sub_receta_id']);
  },
  down: async (qi) => qi.dropTable('detalle_sub_recetas'),
};
