'use strict';

const MATERIAS = [
  { nombre: 'Alas',                    unidad_medida: 'unidad', precio_unitario: 2954.5 },
  { nombre: 'Bbq',                     unidad_medida: 'gr',     precio_unitario: 6.5    },
  { nombre: 'Limonada 14 oz',          unidad_medida: 'unidad', precio_unitario: 820.1  },
  { nombre: 'Harina',                  unidad_medida: 'gr',     precio_unitario: 2.9    },
  { nombre: 'Sal',                     unidad_medida: 'gr',     precio_unitario: 2.7    },
  { nombre: 'Ajo en polvo',            unidad_medida: 'gr',     precio_unitario: 54.4   },
  { nombre: 'Papa francesa grande',    unidad_medida: 'unidad', precio_unitario: 869.3  },
  { nombre: 'Costillas',               unidad_medida: 'gr',     precio_unitario: 29.7   },
  { nombre: 'Churrasco',               unidad_medida: 'gr',     precio_unitario: 36.0   },
  { nombre: 'Arepa blanca',            unidad_medida: 'unidad', precio_unitario: 398.0  },
  { nombre: 'Chimichurri',             unidad_medida: 'gr',     precio_unitario: 243.6  },
  { nombre: 'Pechuga asada',           unidad_medida: 'unidad', precio_unitario: 5269.8 },
  { nombre: 'Salchicha americana',     unidad_medida: 'unidad', precio_unitario: 2093.7 },
  { nombre: 'Sobrebarriga desmechada', unidad_medida: 'unidad', precio_unitario: 1354.6 },
  { nombre: 'Pechuga desmechada',      unidad_medida: 'unidad', precio_unitario: 1312.1 },
  { nombre: 'Chorizo',                 unidad_medida: 'unidad', precio_unitario: 3045.0 },
  { nombre: 'Chicharron',              unidad_medida: 'unidad', precio_unitario: 754.9  },
  { nombre: 'Salsa de maiz',           unidad_medida: 'gr',     precio_unitario: 11.2   },
  { nombre: 'Huevos de codorniz',      unidad_medida: 'unidad', precio_unitario: 208.3  },
  { nombre: 'Papa ripio',              unidad_medida: 'gr',     precio_unitario: 7.3    },
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
    console.log('[seed] Materias primas parrilla/perros cargadas.');
  },
  down: async (qi) => {
    const nombres = MATERIAS.map((m) => `'${m.nombre}'`).join(', ');
    await qi.sequelize.query(`DELETE FROM materias_primas WHERE nombre IN (${nombres})`);
  },
};
