'use strict';

const path = require('path');
require(path.join(__dirname, '..', 'config', 'env')).loadEnvFile();

module.exports = {
  async up() {
    const service = require('../services/subrecetaService');

    // Carne Hamburguesa: por unidad (1 und = 1 medallón de 100g)
    await service.create({
      nombre: 'Carne Hamburguesa',
      descripcion: 'Medallón de carne condimentado y moldeado',
      unidad_medida: 'und',
      stock_actual: 0,
      costo_produccion: 0,
      ingredientes: [
        { materia_prima_id: 1,  cantidad: 0.100 }, // Carne Molida 100g
        { materia_prima_id: 11, cantidad: 2 },      // Sal 2g
        { materia_prima_id: 12, cantidad: 1 },      // Pimienta Negra 1g
        { materia_prima_id: 8,  cantidad: 2 },      // Salsa Inglesa 2ml
      ],
    });

    // Salsa Especial: por ml (1 porción = 30ml)
    await service.create({
      nombre: 'Salsa Especial',
      descripcion: 'Mezcla de salsas para montaje de hamburguesas',
      unidad_medida: 'ml',
      stock_actual: 0,
      costo_produccion: 0,
      ingredientes: [
        { materia_prima_id: 9,  cantidad: 15 }, // Mayonesa 15ml
        { materia_prima_id: 10, cantidad: 5 },  // Mostaza 5ml
        { materia_prima_id: 7,  cantidad: 10 }, // Salsa BBQ 10ml
      ],
    });

    // Cebolla Caramelizada: por und (1 porción)
    await service.create({
      nombre: 'Cebolla Caramelizada',
      descripcion: 'Cebolla cocida lentamente con aceite',
      unidad_medida: 'und',
      stock_actual: 0,
      costo_produccion: 0,
      ingredientes: [
        { materia_prima_id: 17, cantidad: 0.050 }, // Cebolla Cabezona 50g
        { materia_prima_id: 14, cantidad: 5 },      // Aceite Vegetal 5ml
        { materia_prima_id: 11, cantidad: 1 },      // Sal 1g
      ],
    });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('subreceta_materias_primas', null, {});
    await queryInterface.bulkDelete('subrecetas', null, {});
  },
};
