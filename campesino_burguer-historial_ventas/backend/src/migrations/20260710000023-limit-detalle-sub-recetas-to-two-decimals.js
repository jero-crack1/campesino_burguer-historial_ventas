module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE detalle_sub_recetas
      ALTER COLUMN cantidad TYPE NUMERIC(10, 2)
      USING ROUND(cantidad, 2);
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE detalle_sub_recetas
      ALTER COLUMN cantidad TYPE NUMERIC(10, 3);
    `);
  },
};
