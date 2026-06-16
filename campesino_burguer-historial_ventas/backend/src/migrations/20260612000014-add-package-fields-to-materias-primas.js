module.exports = {
  up: async (qi, Sq) => {
    await qi.addColumn('materias_primas', 'costo_paquete', {
      type: Sq.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: null,
    });
    await qi.addColumn('materias_primas', 'cantidad_paquete', {
      type: Sq.DECIMAL(10, 3),
      allowNull: true,
      defaultValue: null,
    });
  },
  down: async (qi) => {
    await qi.removeColumn('materias_primas', 'costo_paquete');
    await qi.removeColumn('materias_primas', 'cantidad_paquete');
  },
};
