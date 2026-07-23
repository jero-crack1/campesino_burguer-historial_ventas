'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('recetas', 'en_promocion', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('recetas', 'precio_promocion', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('recetas', 'promocion_desde', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn('recetas', 'promocion_hasta', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('recetas', 'en_promocion');
    await queryInterface.removeColumn('recetas', 'precio_promocion');
    await queryInterface.removeColumn('recetas', 'promocion_desde');
    await queryInterface.removeColumn('recetas', 'promocion_hasta');
  },
};
