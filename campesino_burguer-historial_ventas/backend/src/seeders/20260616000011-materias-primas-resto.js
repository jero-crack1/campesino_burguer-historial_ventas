'use strict';

const MATERIAS = [
  { nombre: 'Salsa picante',               unidad_medida: 'gr',     precio_unitario: 6.5    },
  { nombre: 'Choclitos',                   unidad_medida: 'gr',     precio_unitario: 31.5   },
  { nombre: 'Jalapeños',                   unidad_medida: 'gr',     precio_unitario: 10.5   },
  { nombre: 'Pimentones caramelizados',    unidad_medida: 'unidad', precio_unitario: 236.5  },
  { nombre: 'Maiz dulce',                  unidad_medida: 'gr',     precio_unitario: 7.8    },
  { nombre: 'Aguacate',                    unidad_medida: 'unidad', precio_unitario: 866.7  },
  { nombre: 'Huevos',                      unidad_medida: 'unidad', precio_unitario: 500.0  },
  { nombre: 'Patacon lamina',              unidad_medida: 'unidad', precio_unitario: 2140.0 },
  { nombre: 'Papa francesa salc tradicion',unidad_medida: 'unidad', precio_unitario: 1290.6 },
  { nombre: 'Papa francesa salc campo',    unidad_medida: 'unidad', precio_unitario: 1144.0 },
  { nombre: 'Pan perro',                   unidad_medida: 'unidad', precio_unitario: 900.0  },
  { nombre: 'Piña almibar',               unidad_medida: 'gr',     precio_unitario: 5.2    },
];

module.exports = {
  up: async (qi) => {
    const now = new Date();
    for (const mp of MATERIAS) {
      const [[{ count }]] = await qi.sequelize.query(
        'SELECT COUNT(*) as count FROM materias_primas WHERE nombre = :nombre',
        { replacements: { nombre: mp.nombre } }
      );
      if (parseInt(count) > 0) continue;
      await qi.sequelize.query(
        `INSERT INTO materias_primas (nombre, unidad_medida, stock_actual, stock_minimo, precio_unitario, created_at, updated_at)
         VALUES (:nombre, :unidad_medida, 0, 0, :precio_unitario, :now, :now)`,
        { replacements: { ...mp, now } }
      );
    }
    console.log('[seed] Materias primas resto del menú cargadas.');
  },
  down: async (qi) => {
    const nombres = MATERIAS.map((m) => `'${m.nombre.replace(/'/g, "''")}'`).join(', ');
    await qi.sequelize.query(`DELETE FROM materias_primas WHERE nombre IN (${nombres})`);
  },
};
