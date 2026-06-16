module.exports = {
  up: async (qi) => {
    await qi.removeConstraint('detalle_compras', 'detalle_compras_materia_prima_id_fkey');
    await qi.addConstraint('detalle_compras', {
      fields: ['materia_prima_id'],
      type: 'foreign key',
      name: 'detalle_compras_materia_prima_id_fkey',
      references: { table: 'materias_primas', field: 'id' },
      onDelete: 'CASCADE',
    });
  },
  down: async (qi) => {
    await qi.removeConstraint('detalle_compras', 'detalle_compras_materia_prima_id_fkey');
    await qi.addConstraint('detalle_compras', {
      fields: ['materia_prima_id'],
      type: 'foreign key',
      name: 'detalle_compras_materia_prima_id_fkey',
      references: { table: 'materias_primas', field: 'id' },
    });
  },
};
