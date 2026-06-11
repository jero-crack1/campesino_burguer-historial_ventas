'use strict';

const path = require('path');
require(path.join(__dirname, '..', 'config', 'env')).loadEnvFile();

module.exports = {
  async up() {
    const subService = require('../services/subrecetaService');
    const recService = require('../services/recetaService');
    const ventaService = require('../services/ventaService');

    // Asegurar stock de subrecetas
    await subService.producir(1, 20); // Carne Hamburguesa x20
    await subService.producir(2, 20); // Salsa Especial x20
    await subService.producir(3, 1);  // Cebolla Caramelizada x1 (limitado por Aceite Vegetal)

    // Asegurar stock de recetas
    await recService.producir(1, 10); // Hamburguesa Clásica x10
    await recService.producir(2, 1);  // Hamburguesa Doble x1

    // Venta 1 — mesa en mostrador
    await ventaService.create({
      fecha: '2026-06-08',
      cliente: 'Mesa 3',
      detalles: [
        { receta_id: 1, cantidad: 2 }, // 2 Hamburguesas Clásicas
        { receta_id: 2, cantidad: 1 }, // 1 Hamburguesa Doble
      ],
    });

    // Venta 2 — domicilio
    await ventaService.create({
      fecha: '2026-06-09',
      cliente: 'Domicilio — Carlos Gómez',
      detalles: [
        { receta_id: 1, cantidad: 3 }, // 3 Hamburguesas Clásicas
      ],
    });

    // Venta 3 — venta rápida sin cliente
    await ventaService.create({
      fecha: '2026-06-10',
      cliente: null,
      detalles: [
        { receta_id: 1, cantidad: 1 }, // 1 Hamburguesa Clásica
      ],
    });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('detalle_ventas', null, {});
    await queryInterface.bulkDelete('ventas', null, {});
  },
};
