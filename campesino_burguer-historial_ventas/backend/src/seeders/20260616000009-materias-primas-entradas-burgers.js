'use strict';

const MATERIAS = [
  { nombre: 'Rellena',             unidad_medida: 'gr',     precio_unitario: 12.0    },
  { nombre: 'Longaniza',           unidad_medida: 'gr',     precio_unitario: 25.0    },
  { nombre: 'Patacon medallon',    unidad_medida: 'gr',     precio_unitario: 8.4     },
  { nombre: 'Hogo',                unidad_medida: 'unidad', precio_unitario: 307.9   },
  { nombre: 'Masa peto',           unidad_medida: 'gr',     precio_unitario: 3.6     },
  { nombre: 'Doritos',             unidad_medida: 'unidad', precio_unitario: 3449.0  },
  { nombre: "Pico e' gallo",       unidad_medida: 'unidad', precio_unitario: 444.9   },
  { nombre: 'Salsa cheddar',       unidad_medida: 'gr',     precio_unitario: 25.2    },
  { nombre: 'Aros de cebolla',     unidad_medida: 'unidad', precio_unitario: 17.6    },
  { nombre: 'Sour cream',          unidad_medida: 'unidad', precio_unitario: 24.8    },
  { nombre: 'Lechuga',             unidad_medida: 'gr',     precio_unitario: 3.8     },
  { nombre: 'Tomate chonto',       unidad_medida: 'gr',     precio_unitario: 5.9     },
  { nombre: 'Carne burger doble',  unidad_medida: 'unidad', precio_unitario: 2757.0  },
  { nombre: 'Pollo grille',        unidad_medida: 'unidad', precio_unitario: 3066.8  },
  { nombre: 'Salsa champiñones',   unidad_medida: 'unidad', precio_unitario: 1641.4  },
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
    console.log('[seed] Materias primas entradas/burgers cargadas.');
  },
  down: async (qi) => {
    const nombres = MATERIAS.map((m) => `'${m.nombre.replace(/'/g, "''")}'`).join(', ');
    await qi.sequelize.query(`DELETE FROM materias_primas WHERE nombre IN (${nombres})`);
  },
};
