'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('recetas', 'stock_minimo', {
      type: Sequelize.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('recetas', 'stock_minimo');
  },
};
