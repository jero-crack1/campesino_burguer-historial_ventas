'use strict';

const COSTOS = [
  // Entradas
  { nombre: 'Rellena',              pct: 30 },
  { nombre: 'Longaniza',            pct: 30 },
  { nombre: 'Patacones',            pct: 28 },
  { nombre: 'Chorizo con Arepa',    pct: 30 },
  { nombre: 'Choricriolla',         pct: 30 },
  { nombre: 'Arepas Campesinas',    pct: 35 },
  { nombre: 'Dorilocos',            pct: 40 },
  { nombre: 'Aros de Cebolla',      pct: 25 },
  // Burgers
  { nombre: 'Tradición',            pct: 30 },
  { nombre: 'Doble Tradición',      pct: 30 },
  { nombre: 'Fusión Campesina',     pct: 30 },
  { nombre: "Chicken's Campirana",  pct: 30 },
  { nombre: 'Arrebatada',           pct: 30 },
  { nombre: 'Mastersina',           pct: 30 },
  { nombre: 'Colombiana',           pct: 30 },
  { nombre: 'Campesino Burger',     pct: 30 },
  { nombre: 'Bacon del Campo',      pct: 30 },
  // Patacón
  { nombre: 'Patacón Arriero',      pct: 35 },
  // Salchipapas
  { nombre: 'Salchipapa Tradición', pct: 35 },
  { nombre: 'Salchipapa del Campo', pct: 30 },
  // Mazorcada
  { nombre: 'Mazorcada Campesina',  pct: 40 },
  // Perros calientes
  { nombre: 'El Criollo',           pct: 30 },
  { nombre: 'El Arriero',           pct: 30 },
  { nombre: 'El Gaucho',            pct: 40 },
  { nombre: 'El Montañero',         pct: 30 },
  // Parrilla
  { nombre: 'Campesino Caliente',   pct: 35 },
  { nombre: 'Pechuga Gratinada',    pct: 30 },
  { nombre: 'Churrasco',            pct: 40 },
  { nombre: 'Costillitas',          pct: 40 },
  { nombre: 'Alitas',               pct: 30 },
  // Combos
  { nombre: 'Combo Papa Francesa + Gaseosa', pct: 30 },
  { nombre: 'Combo Papa Criolla + Gaseosa',  pct: 30 },
  // Pizzas
  { nombre: 'Pizza Pollo Champiñones', pct: 35 },
  { nombre: 'Pizza Hawaiana',          pct: 35 },
  { nombre: 'Pizza Pepperoni',         pct: 35 },
  { nombre: 'Pizza Tocineta Maíz',     pct: 35 },
  { nombre: 'Pizza Mexicana',          pct: 35 },
  { nombre: 'Pizza Napolitana',        pct: 35 },
];

module.exports = {
  async up(queryInterface) {
    for (const { nombre, pct } of COSTOS) {
      await queryInterface.sequelize.query(
        `UPDATE recetas SET costo_objetivo = :pct WHERE nombre ILIKE :nombre`,
        { replacements: { pct, nombre } }
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`UPDATE recetas SET costo_objetivo = NULL`);
  },
};
