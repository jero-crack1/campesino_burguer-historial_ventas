'use strict';

// Burgers con receta incorrecta — DELETE + REINSERT
const BURGERS_CORRECCION = [
  {
    nombre: "Chicken's Campirana", costo: 7395,
    ingredientes: [
      { nombre: 'Pollo grille',             cantidad: 1   },
      { nombre: 'Salsa champiñones',        cantidad: 1   },
      { nombre: 'Pan burger',               cantidad: 1   },
      { nombre: 'Cebolla caramelizada',     cantidad: 1   },
      { nombre: 'Salsa de la casa',         cantidad: 1.5 },
      { nombre: 'Queso mozarella taj',      cantidad: 25  },
      { nombre: 'Lechuga',                  cantidad: 5   },
      { nombre: 'Sucedaneo de mantequilla', cantidad: 5   },
      { nombre: 'Tomate chonto',            cantidad: 5   },
    ],
  },
  {
    nombre: 'Arrebatada', costo: 6418,
    ingredientes: [
      { nombre: 'Carne burger',             cantidad: 1  },
      { nombre: 'Pan burger',               cantidad: 1  },
      { nombre: 'Salsa picante',            cantidad: 5  },
      { nombre: 'Choclitos',               cantidad: 2  },
      { nombre: 'Jalapeños',               cantidad: 15 },
      { nombre: 'Tocineta',               cantidad: 23 },
      { nombre: 'Cebolla caramelizada',     cantidad: 1  },
      { nombre: 'Salsa de la casa',         cantidad: 1  },
      { nombre: 'Queso mozarella taj',      cantidad: 25 },
      { nombre: 'Lechuga',                  cantidad: 5  },
      { nombre: 'Sucedaneo de mantequilla', cantidad: 5  },
      { nombre: 'Tomate chonto',            cantidad: 5  },
    ],
  },
  {
    nombre: 'Mastersina', costo: 8004,
    ingredientes: [
      { nombre: 'Carne burger',             cantidad: 1    },
      { nombre: 'Pan burger',               cantidad: 1    },
      { nombre: 'Tocineta',               cantidad: 25.15},
      { nombre: 'Chorizo',                  cantidad: 0.5  },
      { nombre: 'Pimentones caramelizados', cantidad: 1    },
      { nombre: 'Salsa de la casa',         cantidad: 1    },
      { nombre: 'Queso mozarella taj',      cantidad: 25   },
      { nombre: 'Lechuga',                  cantidad: 5    },
      { nombre: 'Sucedaneo de mantequilla', cantidad: 5    },
    ],
  },
  {
    nombre: 'Colombiana', costo: 8723,
    ingredientes: [
      { nombre: 'Carne burger',             cantidad: 1    },
      { nombre: 'Maiz dulce',              cantidad: 20   },
      { nombre: 'Salsa champiñones',        cantidad: 1    },
      { nombre: 'Pan burger',               cantidad: 1    },
      { nombre: 'Cebolla caramelizada',     cantidad: 1    },
      { nombre: 'Tocineta',               cantidad: 37.5 },
      { nombre: 'Patacon medallon',         cantidad: 10   },
      { nombre: 'Salsa de la casa',         cantidad: 1.5  },
      { nombre: 'Queso mozarella taj',      cantidad: 25   },
      { nombre: 'Lechuga',                  cantidad: 5    },
      { nombre: 'Sucedaneo de mantequilla', cantidad: 5    },
      { nombre: 'Tomate chonto',            cantidad: 5    },
    ],
  },
  {
    nombre: 'Campesino Burger', costo: 7677,
    ingredientes: [
      { nombre: 'Carne burger',             cantidad: 1   },
      { nombre: 'Aguacate',                 cantidad: 0.5 },
      { nombre: 'Hogo',                     cantidad: 1   },
      { nombre: 'Pan burger',               cantidad: 1   },
      { nombre: 'Cebolla caramelizada',     cantidad: 1   },
      { nombre: 'Tocineta',               cantidad: 25  },
      { nombre: 'Huevos',                   cantidad: 1   },
      { nombre: 'Salsa de la casa',         cantidad: 1.5 },
      { nombre: 'Queso mozarella taj',      cantidad: 25  },
      { nombre: 'Lechuga',                  cantidad: 5   },
      { nombre: 'Sucedaneo de mantequilla', cantidad: 5   },
      { nombre: 'Tomate chonto',            cantidad: 5   },
    ],
  },
];

// Resto del menú — idempotente (solo insertan si no tienen ingredientes)
const RESTO = [
  {
    nombre: 'Patacón Arriero', costo: 12757,
    ingredientes: [
      { nombre: 'Patacon lamina',           cantidad: 1  },
      { nombre: 'Sobrebarriga desmechada',  cantidad: 1  },
      { nombre: 'Pechuga desmechada',       cantidad: 1  },
      { nombre: 'Chorizo',                  cantidad: 1  },
      { nombre: 'Chicharron',               cantidad: 2  },
      { nombre: 'Salsa de la casa',         cantidad: 1  },
      { nombre: 'Hogo',                     cantidad: 1  },
      { nombre: 'Huevos de codorniz',       cantidad: 2  },
      { nombre: 'Queso mozarella taj',      cantidad: 50 },
      { nombre: 'Papa ripio',               cantidad: 15 },
    ],
  },
  {
    nombre: 'Salchipapa Tradición', costo: 4033,
    ingredientes: [
      { nombre: 'Papa francesa salc tradicion', cantidad: 1 },
      { nombre: 'Salchicha americana',          cantidad: 1 },
      { nombre: 'Queso mozarella taj',          cantidad: 1 },
      { nombre: 'Salsa de la casa',             cantidad: 1 },
    ],
  },
  {
    nombre: 'Salchipapa del Campo', costo: 9551,
    ingredientes: [
      { nombre: 'Papa francesa salc campo',  cantidad: 1  },
      { nombre: 'Sobrebarriga desmechada',   cantidad: 1  },
      { nombre: 'Pechuga desmechada',        cantidad: 1  },
      { nombre: 'Chorizo',                   cantidad: 0.5},
      { nombre: 'Chicharron',                cantidad: 2  },
      { nombre: 'Salsa de la casa',          cantidad: 1  },
      { nombre: 'Huevos de codorniz',        cantidad: 2  },
      { nombre: 'Queso mozarella taj',       cantidad: 50 },
      { nombre: 'Papa ripio',                cantidad: 15 },
    ],
  },
  {
    nombre: 'Mazorcada Campesina', costo: 12843,
    ingredientes: [
      { nombre: 'Maiz dulce',              cantidad: 200 },
      { nombre: 'Sobrebarriga desmechada',  cantidad: 1   },
      { nombre: 'Pechuga desmechada',       cantidad: 1   },
      { nombre: 'Chorizo',                  cantidad: 1   },
      { nombre: 'Chicharron',               cantidad: 2   },
      { nombre: 'Salsa de la casa',         cantidad: 1   },
      { nombre: 'Salsa de maiz',            cantidad: 25  },
      { nombre: 'Bbq',                      cantidad: 25  },
      { nombre: 'Huevos de codorniz',       cantidad: 2   },
      { nombre: 'Queso mozarella taj',      cantidad: 50  },
      { nombre: 'Lechuga',                  cantidad: 20  },
      { nombre: "Pico e' gallo",            cantidad: 1   },
      { nombre: 'Papa ripio',               cantidad: 15  },
    ],
  },
  {
    nombre: 'El Criollo', costo: 5094,
    ingredientes: [
      { nombre: 'Salchicha americana',  cantidad: 1  },
      { nombre: 'Piña almibar',        cantidad: 60 },
      { nombre: 'Pan perro',            cantidad: 1  },
      { nombre: 'Papa ripio',           cantidad: 15 },
      { nombre: 'Salsa de la casa',     cantidad: 1  },
      { nombre: 'Salsa de maiz',        cantidad: 15 },
      { nombre: 'Bbq',                  cantidad: 15 },
      { nombre: 'Huevos de codorniz',   cantidad: 1  },
      { nombre: 'Queso mozarella taj',  cantidad: 25 },
    ],
  },
  {
    nombre: 'El Arriero', costo: 6416,
    ingredientes: [
      { nombre: 'Salchicha americana',  cantidad: 1  },
      { nombre: 'Cebolla caramelizada', cantidad: 2  },
      { nombre: 'Pan perro',            cantidad: 1  },
      { nombre: 'Papa ripio',           cantidad: 15 },
      { nombre: 'Salsa de la casa',     cantidad: 1  },
      { nombre: 'Salsa de maiz',        cantidad: 15 },
      { nombre: 'Bbq',                  cantidad: 15 },
      { nombre: 'Huevos de codorniz',   cantidad: 2  },
      { nombre: 'Tocineta',           cantidad: 25 },
      { nombre: 'Queso mozarella taj',  cantidad: 50 },
    ],
  },
  {
    nombre: 'El Gaucho', costo: 6047,
    ingredientes: [
      { nombre: 'Chorizo',             cantidad: 1  },
      { nombre: 'Chimichurri',         cantidad: 2  },
      { nombre: 'Pan perro',           cantidad: 1  },
      { nombre: 'Queso mozarella taj', cantidad: 50 },
    ],
  },
  {
    nombre: 'El Montañero', costo: 7771,
    ingredientes: [
      { nombre: 'Chorizo',             cantidad: 1  },
      { nombre: 'Cebolla caramelizada',cantidad: 2  },
      { nombre: 'Pan perro',           cantidad: 1  },
      { nombre: 'Papa ripio',          cantidad: 15 },
      { nombre: 'Salsa de la casa',    cantidad: 1  },
      { nombre: 'Salsa de maiz',       cantidad: 15 },
      { nombre: 'Bbq',                 cantidad: 15 },
      { nombre: 'Huevos de codorniz',  cantidad: 2  },
      { nombre: 'Tocineta',          cantidad: 25 },
      { nombre: 'Chimichurri',         cantidad: 1  },
      { nombre: 'Queso mozarella taj', cantidad: 50 },
    ],
  },
];

module.exports = {
  up: async (qi) => {
    const now = new Date();

    const mpCache = {};
    const [allMps] = await qi.sequelize.query('SELECT id, nombre FROM materias_primas');
    for (const mp of allMps) mpCache[mp.nombre] = mp.id;

    // ── BURGERS CORRECCIÓN (DELETE + INSERT) ──────────────────────────────
    for (const rec of BURGERS_CORRECCION) {
      const [[receta]] = await qi.sequelize.query(
        'SELECT id FROM recetas WHERE nombre = :nombre LIMIT 1',
        { replacements: { nombre: rec.nombre } }
      );
      if (!receta) { console.log(`[seed] No encontrada: ${rec.nombre}`); continue; }

      await qi.sequelize.query('DELETE FROM detalle_recetas WHERE receta_id = :id', { replacements: { id: receta.id } });

      for (const ing of rec.ingredientes) {
        const mpId = mpCache[ing.nombre];
        if (!mpId) { console.log(`[seed] MP no encontrada: ${ing.nombre}`); continue; }
        await qi.sequelize.query(
          `INSERT INTO detalle_recetas (receta_id, tipo, materia_prima_id, sub_receta_id, cantidad, created_at, updated_at)
           VALUES (:receta_id, 'materia_prima', :mp_id, NULL, :cantidad, :now, :now)`,
          { replacements: { receta_id: receta.id, mp_id: mpId, cantidad: ing.cantidad, now } }
        );
      }

      await qi.sequelize.query(
        'UPDATE recetas SET costo_produccion = :costo WHERE id = :id',
        { replacements: { costo: rec.costo, id: receta.id } }
      );
      console.log(`[seed] ✓ ${rec.nombre} corregida — costo $${rec.costo}`);
    }

    // ── RESTO DEL MENÚ (idempotente) ──────────────────────────────────────
    for (const rec of RESTO) {
      const [[receta]] = await qi.sequelize.query(
        'SELECT id FROM recetas WHERE nombre = :nombre LIMIT 1',
        { replacements: { nombre: rec.nombre } }
      );
      if (!receta) { console.log(`[seed] No encontrada: ${rec.nombre}`); continue; }

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

      await qi.sequelize.query(
        'UPDATE recetas SET costo_produccion = :costo WHERE id = :id AND costo_produccion = 0',
        { replacements: { costo: rec.costo, id: receta.id } }
      );
      console.log(`[seed] ✓ ${rec.nombre} — costo $${rec.costo}`);
    }
  },
  down: async (qi) => {
    for (const rec of [...BURGERS_CORRECCION, ...RESTO]) {
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
