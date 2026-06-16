module.exports = {
  up: async (qi) => {
    await qi.removeConstraint('detalle_sub_recetas', 'detalle_sub_recetas_materia_prima_id_fkey');
    await qi.addConstraint('detalle_sub_recetas', {
      fields: ['materia_prima_id'],
      type: 'foreign key',
      name: 'detalle_sub_recetas_materia_prima_id_fkey',
      references: { table: 'materias_primas', field: 'id' },
      onDelete: 'CASCADE',
    });

    await qi.removeConstraint('detalle_recetas', 'detalle_recetas_materia_prima_id_fkey');
    await qi.addConstraint('detalle_recetas', {
      fields: ['materia_prima_id'],
      type: 'foreign key',
      name: 'detalle_recetas_materia_prima_id_fkey',
      references: { table: 'materias_primas', field: 'id' },
      onDelete: 'CASCADE',
    });
  },
  down: async (qi) => {
    await qi.removeConstraint('detalle_sub_recetas', 'detalle_sub_recetas_materia_prima_id_fkey');
    await qi.addConstraint('detalle_sub_recetas', {
      fields: ['materia_prima_id'],
      type: 'foreign key',
      name: 'detalle_sub_recetas_materia_prima_id_fkey',
      references: { table: 'materias_primas', field: 'id' },
    });

    await qi.removeConstraint('detalle_recetas', 'detalle_recetas_materia_prima_id_fkey');
    await qi.addConstraint('detalle_recetas', {
      fields: ['materia_prima_id'],
      type: 'foreign key',
      name: 'detalle_recetas_materia_prima_id_fkey',
      references: { table: 'materias_primas', field: 'id' },
    });
  },
};
