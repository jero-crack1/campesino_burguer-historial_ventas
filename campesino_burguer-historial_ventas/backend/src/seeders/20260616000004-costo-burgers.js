'use strict';

const COSTO = 8232;

const BURGERS = [
  'Tradición',
  'Doble Tradición',
  'Fusión Campesina',
  "Chicken's Campirana",
  'Arrebatada',
  'Mastersina',
  'Colombiana',
  'Campesino Burger',
  'Bacon del Campo',
];

module.exports = {
  up: async (qi) => {
    for (const nombre of BURGERS) {
      await qi.sequelize.query(
        'UPDATE recetas SET costo_produccion = :costo WHERE nombre = :nombre AND costo_produccion = 0',
        { replacements: { costo: COSTO, nombre } }
      );
    }
    console.log(`[seed] Costo de producción $${COSTO} aplicado a ${BURGERS.length} burgers.`);
  },
  down: async (qi) => {
    for (const nombre of BURGERS) {
      await qi.sequelize.query(
        'UPDATE recetas SET costo_produccion = 0 WHERE nombre = :nombre',
        { replacements: { nombre } }
      );
    }
  },
};
