'use strict';

const path = require('path');
require(path.join(__dirname, '..', 'config', 'env')).loadEnvFile();

module.exports = {
  async up() {
    const service = require('../services/compraService');

    await service.create({
      fecha: '2026-06-01',
      observaciones: 'Compra semanal de proteínas',
      detalles: [
        { materia_prima_id: 1, cantidad: 15, precio_unitario: 17500 },
        { materia_prima_id: 2, cantidad: 8,  precio_unitario: 13500 },
      ],
    });

    await service.create({
      fecha: '2026-06-05',
      observaciones: 'Reposición de insumos generales',
      detalles: [
        { materia_prima_id: 3,  cantidad: 100, precio_unitario: 750  },
        { materia_prima_id: 4,  cantidad: 50,  precio_unitario: 1100 },
        { materia_prima_id: 5,  cantidad: 5,   precio_unitario: 21000 },
        { materia_prima_id: 11, cantidad: 1000, precio_unitario: 0.05 },
        { materia_prima_id: 14, cantidad: 3,   precio_unitario: 7200  },
      ],
    });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('detalle_compras', null, {});
    await queryInterface.bulkDelete('compras', null, {});
  },
};
