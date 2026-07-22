'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ventas', 'descuento_porcentaje', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('ventas', 'descuento_empleado', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('ventas', 'autorizado_por', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ventas', 'descuento_porcentaje');
    await queryInterface.removeColumn('ventas', 'descuento_empleado');
    await queryInterface.removeColumn('ventas', 'autorizado_por');
  },
};
