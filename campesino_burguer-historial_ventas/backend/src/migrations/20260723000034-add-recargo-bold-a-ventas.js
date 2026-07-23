'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ventas', 'recargo_bold_porcentaje', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('ventas', 'recargo_bold_valor', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ventas', 'recargo_bold_porcentaje');
    await queryInterface.removeColumn('ventas', 'recargo_bold_valor');
  },
};
