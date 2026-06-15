module.exports = {
  up: async (qi, Sq) => {
    await qi.addColumn('detalle_sub_recetas', 'sub_receta_ingrediente_id', {
      type: Sq.INTEGER,
      allowNull: true,
      references: { model: 'sub_recetas', key: 'id' },
      onDelete: 'CASCADE',
    });
    await qi.changeColumn('detalle_sub_recetas', 'materia_prima_id', {
      type: Sq.INTEGER,
      allowNull: true,
      references: { model: 'materias_primas', key: 'id' },
    });
  },
  down: async (qi, Sq) => {
    await qi.removeColumn('detalle_sub_recetas', 'sub_receta_ingrediente_id');
    await qi.changeColumn('detalle_sub_recetas', 'materia_prima_id', {
      type: Sq.INTEGER,
      allowNull: false,
      references: { model: 'materias_primas', key: 'id' },
    });
  },
};
