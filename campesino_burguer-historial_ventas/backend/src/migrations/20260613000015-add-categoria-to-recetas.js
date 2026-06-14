module.exports = {
  up: async (qi, Sq) => {
    await qi.addColumn('recetas', 'categoria', { type: Sq.STRING(50), allowNull: true });
  },
  down: async (qi) => qi.removeColumn('recetas', 'categoria'),
};
