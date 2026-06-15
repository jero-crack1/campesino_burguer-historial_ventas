module.exports = {
  up: async (qi, Sq) => {
    await qi.removeConstraint('producciones_sub_recetas', 'producciones_sub_recetas_sub_receta_id_fkey');
    await qi.addConstraint('producciones_sub_recetas', {
      fields: ['sub_receta_id'],
      type: 'foreign key',
      name: 'producciones_sub_recetas_sub_receta_id_fkey',
      references: { table: 'sub_recetas', field: 'id' },
      onDelete: 'CASCADE',
    });
  },
  down: async (qi) => {
    await qi.removeConstraint('producciones_sub_recetas', 'producciones_sub_recetas_sub_receta_id_fkey');
    await qi.addConstraint('producciones_sub_recetas', {
      fields: ['sub_receta_id'],
      type: 'foreign key',
      name: 'producciones_sub_recetas_sub_receta_id_fkey',
      references: { table: 'sub_recetas', field: 'id' },
    });
  },
};
