module.exports = {
  up: async (qi, Sq) => {
    await qi.addColumn('sub_recetas', 'porciones',    { type: Sq.DECIMAL(10, 3), allowNull: true });
    await qi.addColumn('sub_recetas', 'peso_porcion', { type: Sq.DECIMAL(10, 3), allowNull: true });
    await qi.addColumn('sub_recetas', 'costo_porcion',{ type: Sq.DECIMAL(12, 2), allowNull: true });
  },
  down: async (qi) => {
    await qi.removeColumn('sub_recetas', 'porciones');
    await qi.removeColumn('sub_recetas', 'peso_porcion');
    await qi.removeColumn('sub_recetas', 'costo_porcion');
  },
};
