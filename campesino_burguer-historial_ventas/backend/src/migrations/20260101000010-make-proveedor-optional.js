module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('compras', 'proveedor', {
      type: Sequelize.STRING(150),
      allowNull: true,
      defaultValue: null,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('compras', 'proveedor', {
      type: Sequelize.STRING(150),
      allowNull: false,
    });
  },
};
