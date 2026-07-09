'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('recetas', 'costo_objetivo', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('ventas', 'impoconsumo_porcentaje', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('ventas', 'impoconsumo_valor', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('recetas', 'costo_objetivo');
    await queryInterface.removeColumn('ventas', 'impoconsumo_porcentaje');
    await queryInterface.removeColumn('ventas', 'impoconsumo_valor');
  },
};
