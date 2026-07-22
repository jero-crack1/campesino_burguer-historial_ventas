'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ventas', 'anulado_por', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('ventas', 'motivo_anulacion', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('ventas', 'anulado_en', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ventas', 'anulado_por');
    await queryInterface.removeColumn('ventas', 'motivo_anulacion');
    await queryInterface.removeColumn('ventas', 'anulado_en');
  },
};
