'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ventas', 'numero_factura', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.addColumn('ventas', 'observaciones', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ventas', 'numero_factura');
    await queryInterface.removeColumn('ventas', 'observaciones');
  },
};
