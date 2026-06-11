'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('compras', 'proveedor');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('compras', 'proveedor', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },
};
