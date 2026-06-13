module.exports = {
  up: async (qi, Sq) => {
    await qi.addColumn('recetas', 'imagen_url', { type: Sq.STRING(500), allowNull: true });
  },
  down: async (qi) => qi.removeColumn('recetas', 'imagen_url'),
};
