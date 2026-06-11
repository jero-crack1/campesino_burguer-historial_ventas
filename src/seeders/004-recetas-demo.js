'use strict';

const path = require('path');
require(path.join(__dirname, '..', 'config', 'env')).loadEnvFile();

module.exports = {
  async up() {
    const service = require('../services/recetaService');

    // Hamburguesa Clásica
    // Subrecetas: 1 Carne Hamburguesa (id:1) + 1 Salsa Especial (id:2)
    // Materias primas directas: 1 Pan (id:3) + 20g Queso Americano (id:5) + Lechuga (id:15) + Tomate (id:16)
    await service.create({
      nombre: 'Hamburguesa Clásica',
      descripcion: 'Hamburguesa con carne, queso, lechuga y tomate',
      precio_venta: 18000,
      unidad_medida: 'und',
      stock_actual: 0,
      costo_produccion: 0,
      subrecetas: [
        { subreceta_id: 1, cantidad: 1 }, // Carne Hamburguesa x1
        { subreceta_id: 2, cantidad: 1 }, // Salsa Especial x1
      ],
      materias_primas: [
        { materia_prima_id: 3,  cantidad: 1     }, // Pan de Hamburguesa x1
        { materia_prima_id: 5,  cantidad: 0.020 }, // Queso Americano 20g
        { materia_prima_id: 15, cantidad: 0.015 }, // Lechuga 15g
        { materia_prima_id: 16, cantidad: 0.030 }, // Tomate 30g
      ],
    });

    // Hamburguesa Doble
    // Subrecetas: 2 Carne Hamburguesa + 1 Salsa Especial + 1 Cebolla Caramelizada
    // Materias primas: 1 Pan Doble + 40g Queso
    await service.create({
      nombre: 'Hamburguesa Doble',
      descripcion: 'Doble carne con cebolla caramelizada y queso extra',
      precio_venta: 26000,
      unidad_medida: 'und',
      stock_actual: 0,
      costo_produccion: 0,
      subrecetas: [
        { subreceta_id: 1, cantidad: 2 }, // Carne Hamburguesa x2
        { subreceta_id: 2, cantidad: 1 }, // Salsa Especial x1
        { subreceta_id: 3, cantidad: 1 }, // Cebolla Caramelizada x1
      ],
      materias_primas: [
        { materia_prima_id: 4,  cantidad: 1     }, // Pan de Hamburguesa Doble x1
        { materia_prima_id: 5,  cantidad: 0.040 }, // Queso Americano 40g
      ],
    });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('receta_materias_primas', null, {});
    await queryInterface.bulkDelete('receta_subrecetas', null, {});
    await queryInterface.bulkDelete('recetas', null, {});
  },
};
