'use strict';

const RECETAS = [
  {
    nombre: 'Alitas',
    costo: 5858,
    ingredientes: [
      { nombre: 'Alas',                 cantidad: 1  },
      { nombre: 'Bbq',                  cantidad: 40 },
      { nombre: 'Limonada 14 oz',       cantidad: 1  },
      { nombre: 'Harina',               cantidad: 50 },
      { nombre: 'Sal',                  cantidad: 2  },
      { nombre: 'Ajo en polvo',         cantidad: 2  },
      { nombre: 'Papa francesa grande', cantidad: 1  },
    ],
  },
  {
    nombre: 'Costillitas',
    costo: 15711,
    ingredientes: [
      { nombre: 'Costillas',            cantidad: 400.2 },
      { nombre: 'Bbq',                  cantidad: 40    },
      { nombre: 'Limonada 14 oz',       cantidad: 1     },
      { nombre: 'Papa francesa grande', cantidad: 1     },
    ],
  },
  {
    nombre: 'Churrasco',
    costo: 19550,
    ingredientes: [
      { nombre: 'Churrasco',                cantidad: 250 },
      { nombre: 'Arepa blanca',             cantidad: 1   },
      { nombre: 'Sucedaneo de mantequilla', cantidad: 5   },
      { nombre: 'Sal',                      cantidad: 2   },
      { nombre: 'Limonada 14 oz',           cantidad: 1   },
      { nombre: 'Chimichurri',              cantidad: 25  },
      { nombre: 'Papa francesa grande',     cantidad: 1   },
    ],
  },
  {
    nombre: 'Pechuga Gratinada',
    costo: 8924,
    ingredientes: [
      { nombre: 'Pechuga asada',            cantidad: 1  },
      { nombre: 'Arepa blanca',             cantidad: 1  },
      { nombre: 'Sucedaneo de mantequilla', cantidad: 5  },
      { nombre: 'Sal',                      cantidad: 2  },
      { nombre: 'Limonada 14 oz',           cantidad: 1  },
      { nombre: 'Queso mozarella taj',      cantidad: 25 },
      { nombre: 'Papa francesa grande',     cantidad: 1  },
    ],
  },
  {
    nombre: 'Campesino Caliente',
    costo: 10275,
    ingredientes: [
      { nombre: 'Salchicha americana',      cantidad: 1   },
      { nombre: 'Sobrebarriga desmechada',  cantidad: 1   },
      { nombre: 'Pechuga desmechada',       cantidad: 1   },
      { nombre: 'Chorizo',                  cantidad: 0.5 },
      { nombre: 'Chicharron',               cantidad: 1   },
      { nombre: 'Salsa de la casa',         cantidad: 1   },
      { nombre: 'Salsa de maiz',            cantidad: 25  },
      { nombre: 'Bbq',                      cantidad: 25  },
      { nombre: 'Huevos de codorniz',       cantidad: 2   },
      { nombre: 'Queso mozarella taj',      cantidad: 50  },
      { nombre: 'Papa ripio',               cantidad: 15  },
    ],
  },
];

module.exports = {
  up: async (qi) => {
    const now = new Date();

    // Precargar ids de materias primas
    const mpCache = {};
    const [allMps] = await qi.sequelize.query('SELECT id, nombre FROM materias_primas');
    for (const mp of allMps) mpCache[mp.nombre] = mp.id;

    for (const rec of RECETAS) {
      const [[receta]] = await qi.sequelize.query(
        'SELECT id FROM recetas WHERE nombre = :nombre LIMIT 1',
        { replacements: { nombre: rec.nombre } }
      );
      if (!receta) { console.log(`[seed] Receta no encontrada: ${rec.nombre}`); continue; }

      const [[{ count }]] = await qi.sequelize.query(
        'SELECT COUNT(*) as count FROM detalle_recetas WHERE receta_id = :id',
        { replacements: { id: receta.id } }
      );

      if (parseInt(count) === 0) {
        for (const ing of rec.ingredientes) {
          const mpId = mpCache[ing.nombre];
          if (!mpId) { console.log(`[seed] MP no encontrada: ${ing.nombre}`); continue; }
          await qi.sequelize.query(
            `INSERT INTO detalle_recetas (receta_id, tipo, materia_prima_id, sub_receta_id, cantidad, created_at, updated_at)
             VALUES (:receta_id, 'materia_prima', :mp_id, NULL, :cantidad, :now, :now)`,
            { replacements: { receta_id: receta.id, mp_id: mpId, cantidad: ing.cantidad, now } }
          );
        }
      }

      // Actualizar costo si está en 0
      await qi.sequelize.query(
        'UPDATE recetas SET costo_produccion = :costo WHERE id = :id AND costo_produccion = 0',
        { replacements: { costo: rec.costo, id: receta.id } }
      );

      console.log(`[seed] ✓ ${rec.nombre} — costo $${rec.costo}`);
    }
  },
  down: async (qi) => {
    for (const rec of RECETAS) {
      const [[receta]] = await qi.sequelize.query(
        'SELECT id FROM recetas WHERE nombre = :nombre LIMIT 1',
        { replacements: { nombre: rec.nombre } }
      );
      if (!receta) continue;
      await qi.sequelize.query('DELETE FROM detalle_recetas WHERE receta_id = :id', { replacements: { id: receta.id } });
      await qi.sequelize.query('UPDATE recetas SET costo_produccion = 0 WHERE id = :id', { replacements: { id: receta.id } });
    }
  },
};
