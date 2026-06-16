'use strict';

// Ingredientes de la receta estándar Burger Tradición
const MATERIAS = [
  { nombre: 'Carne burger',              unidad_medida: 'unidad', precio_unitario: 3150.9 },
  { nombre: 'Pan burger',                unidad_medida: 'unidad', precio_unitario: 900.0  },
  { nombre: 'Tocineta',                  unidad_medida: 'gr',     precio_unitario: 22.6   },
  { nombre: 'Pepinillos',                unidad_medida: 'gr',     precio_unitario: 12.0   },
  { nombre: 'Salsa de cheddar',          unidad_medida: 'unidad', precio_unitario: 990.9  },
  { nombre: 'Salsa de la casa',          unidad_medida: 'unidad', precio_unitario: 153.9  },
  { nombre: 'Queso mozarella taj',       unidad_medida: 'gr',     precio_unitario: 18.0   },
  { nombre: 'Cebolla caramelizada',      unidad_medida: 'unidad', precio_unitario: 126.4  },
  { nombre: 'Sucedaneo de mantequilla',  unidad_medida: 'gr',     precio_unitario: 11.4   },
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
  },
  down: async (qi) => {
    const nombres = MATERIAS.map((m) => `'${m.nombre}'`).join(', ');
    await qi.sequelize.query(`DELETE FROM materias_primas WHERE nombre IN (${nombres})`);
  },
};
