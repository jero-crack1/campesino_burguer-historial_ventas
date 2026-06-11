module.exports = {
  up: async (qi, Sq) => {
    await qi.createTable('producciones_sub_recetas', {
      id: { type: Sq.INTEGER, primaryKey: true, autoIncrement: true },
      sub_receta_id: { type: Sq.INTEGER, allowNull: false, references: { model: 'sub_recetas', key: 'id' } },
      cantidad_lotes: { type: Sq.INTEGER, allowNull: false, defaultValue: 1 },
      fecha: { type: Sq.DATEONLY, allowNull: false },
      notas: { type: Sq.TEXT },
      created_at: { type: Sq.DATE, allowNull: false },
      updated_at: { type: Sq.DATE, allowNull: false },
    });
    await qi.addIndex('producciones_sub_recetas', ['sub_receta_id']);
  },
  down: async (qi) => qi.dropTable('producciones_sub_recetas'),
};
