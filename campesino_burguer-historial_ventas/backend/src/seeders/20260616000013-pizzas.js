'use strict';

const now = new Date();

// ── Nuevas materias primas ──────────────────────────────────────────────────
const MATERIAS = [
  { nombre: 'Masa pizza',       unidad_medida: 'unidad', precio_unitario: 626.9   },
  { nombre: 'Napolitana',       unidad_medida: 'unidad', precio_unitario: 1140.3  },
  { nombre: 'Champiñones',      unidad_medida: 'gr',     precio_unitario: 24.0    },
  { nombre: 'Oregano seco',     unidad_medida: 'gr',     precio_unitario: 99.5    },
  { nombre: 'Harina de trigo',  unidad_medida: 'gr',     precio_unitario: 2.9     },
  { nombre: 'Harina de maiz',   unidad_medida: 'gr',     precio_unitario: 2.6     },
  { nombre: 'Caja pizza 30x30', unidad_medida: 'unidad', precio_unitario: 1800.0  },
  { nombre: 'Jamon',            unidad_medida: 'gr',     precio_unitario: 19.5    },
  { nombre: 'Peperoni',         unidad_medida: 'gr',     precio_unitario: 65.0    },
  { nombre: 'Cebolla cabezona', unidad_medida: 'gr',     precio_unitario: 5.9     },
];

// ── Pizzas: nuevas recetas con sus ingredientes ─────────────────────────────
const PIZZAS = [
  {
    nombre: 'Pizza Pollo Champiñones', precio_venta: 23000, costo: 8308,
    ingredientes: [
      { nombre: 'Masa pizza',          cantidad: 1   },
      { nombre: 'Queso mozarella taj', cantidad: 150 },
      { nombre: 'Napolitana',          cantidad: 1   },
      { nombre: 'Pechuga desmechada',  cantidad: 1   },
      { nombre: 'Champiñones',         cantidad: 40  },
      { nombre: 'Oregano seco',        cantidad: 5   },
      { nombre: 'Sal',                 cantidad: 2   },
      { nombre: 'Harina de trigo',     cantidad: 20  },
      { nombre: 'Harina de maiz',      cantidad: 10  },
      { nombre: 'Caja pizza 30x30',    cantidad: 1   },
    ],
  },
  {
    nombre: 'Pizza Hawaiana', precio_venta: 23000, costo: 7221,
    ingredientes: [
      { nombre: 'Masa pizza',          cantidad: 1   },
      { nombre: 'Queso mozarella taj', cantidad: 150 },
      { nombre: 'Napolitana',          cantidad: 1   },
      { nombre: 'Piña almibar',       cantidad: 200 },
      { nombre: 'Jamon',               cantidad: 40  },
      { nombre: 'Harina de trigo',     cantidad: 20  },
      { nombre: 'Harina de maiz',      cantidad: 10  },
      { nombre: 'Caja pizza 30x30',    cantidad: 1   },
    ],
  },
  {
    nombre: 'Pizza Pepperoni', precio_venta: 23000, costo: 8305,
    ingredientes: [
      { nombre: 'Masa pizza',          cantidad: 1   },
      { nombre: 'Queso mozarella taj', cantidad: 150 },
      { nombre: 'Napolitana',          cantidad: 1   },
      { nombre: 'Peperoni',            cantidad: 35  },
      { nombre: 'Oregano seco',        cantidad: 5   },
      { nombre: 'Harina de trigo',     cantidad: 20  },
      { nombre: 'Harina de maiz',      cantidad: 10  },
      { nombre: 'Caja pizza 30x30',    cantidad: 1   },
    ],
  },
  {
    nombre: 'Pizza Tocineta Maíz', precio_venta: 23000, costo: 7845,
    ingredientes: [
      { nombre: 'Masa pizza',          cantidad: 1   },
      { nombre: 'Queso mozarella taj', cantidad: 150 },
      { nombre: 'Napolitana',          cantidad: 1   },
      { nombre: 'Tocineta',          cantidad: 84  },
      { nombre: 'Maiz dulce',         cantidad: 60  },
      { nombre: 'Harina de trigo',     cantidad: 20  },
      { nombre: 'Harina de maiz',      cantidad: 10  },
      { nombre: 'Caja pizza 30x30',    cantidad: 1   },
    ],
  },
  {
    nombre: 'Pizza Mexicana', precio_venta: 23000, costo: 8145,
    ingredientes: [
      { nombre: 'Masa pizza',          cantidad: 1    },
      { nombre: 'Queso mozarella taj', cantidad: 150  },
      { nombre: 'Napolitana',          cantidad: 1    },
      { nombre: 'Carne burger',        cantidad: 0.5  },
      { nombre: 'Jalapeños',          cantidad: 20   },
      { nombre: "Pico e' gallo",       cantidad: 1    },
      { nombre: 'Choclitos',          cantidad: 15   },
      { nombre: 'Sal',                 cantidad: 2    },
      { nombre: 'Harina de trigo',     cantidad: 20   },
      { nombre: 'Harina de maiz',      cantidad: 10   },
      { nombre: 'Caja pizza 30x30',    cantidad: 1    },
    ],
  },
  {
    nombre: 'Pizza Napolitana', precio_venta: 23000, costo: 7337,
    ingredientes: [
      { nombre: 'Masa pizza',          cantidad: 1   },
      { nombre: 'Queso mozarella taj', cantidad: 150 },
      { nombre: 'Napolitana',          cantidad: 1   },
      { nombre: 'Tomate chonto',       cantidad: 200 },
      { nombre: 'Cebolla cabezona',    cantidad: 40  },
      { nombre: 'Sal',                 cantidad: 2   },
      { nombre: 'Oregano seco',        cantidad: 5   },
      { nombre: 'Harina de trigo',     cantidad: 20  },
      { nombre: 'Harina de maiz',      cantidad: 10  },
      { nombre: 'Caja pizza 30x30',    cantidad: 1   },
    ],
  },
];

module.exports = {
  up: async (qi) => {
    // 1. Materias primas
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

    // Precargar mapa de MPs
    const mpCache = {};
    const [allMps] = await qi.sequelize.query('SELECT id, nombre FROM materias_primas');
    for (const mp of allMps) mpCache[mp.nombre] = mp.id;

    // 2. Recetas + DetalleRecetas
    for (const pizza of PIZZAS) {
      const [[{ count }]] = await qi.sequelize.query(
        'SELECT COUNT(*) as count FROM recetas WHERE nombre = :nombre',
        { replacements: { nombre: pizza.nombre } }
      );

      let recetaId;
      if (parseInt(count) === 0) {
        const [[inserted]] = await qi.sequelize.query(
          `INSERT INTO recetas (nombre, unidad_produccion, cantidad_produccion, stock_actual, precio_venta, costo_produccion, categoria, created_at, updated_at)
           VALUES (:nombre, 'unidad', 1, 20, :precio_venta, :costo, 'Pizza', :now, :now)
           RETURNING id`,
          { replacements: { nombre: pizza.nombre, precio_venta: pizza.precio_venta, costo: pizza.costo, now } }
        );
        recetaId = inserted.id;
        console.log(`[seed] ✓ Creada: ${pizza.nombre}`);
      } else {
        const [[existing]] = await qi.sequelize.query(
          'SELECT id FROM recetas WHERE nombre = :nombre LIMIT 1',
          { replacements: { nombre: pizza.nombre } }
        );
        recetaId = existing.id;
      }

      // Ingredientes (idempotente)
      const [[{ countDet }]] = await qi.sequelize.query(
        'SELECT COUNT(*) as "countDet" FROM detalle_recetas WHERE receta_id = :id',
        { replacements: { id: recetaId } }
      );
      if (parseInt(countDet) > 0) continue;

      for (const ing of pizza.ingredientes) {
        const mpId = mpCache[ing.nombre];
        if (!mpId) { console.log(`[seed] MP no encontrada: ${ing.nombre}`); continue; }
        await qi.sequelize.query(
          `INSERT INTO detalle_recetas (receta_id, tipo, materia_prima_id, sub_receta_id, cantidad, created_at, updated_at)
           VALUES (:receta_id, 'materia_prima', :mp_id, NULL, :cantidad, :now, :now)`,
          { replacements: { receta_id: recetaId, mp_id: mpId, cantidad: ing.cantidad, now } }
        );
      }
      console.log(`[seed] ✓ Ingredientes cargados: ${pizza.nombre} — costo $${pizza.costo}`);
    }
  },
  down: async (qi) => {
    for (const pizza of PIZZAS) {
      const [[receta]] = await qi.sequelize.query(
        'SELECT id FROM recetas WHERE nombre = :nombre LIMIT 1',
        { replacements: { nombre: pizza.nombre } }
      );
      if (!receta) continue;
      await qi.sequelize.query('DELETE FROM detalle_recetas WHERE receta_id = :id', { replacements: { id: receta.id } });
      await qi.sequelize.query('DELETE FROM recetas WHERE id = :id', { replacements: { id: receta.id } });
    }
    const nombres = MATERIAS.map((m) => `'${m.nombre}'`).join(', ');
    await qi.sequelize.query(`DELETE FROM materias_primas WHERE nombre IN (${nombres})`);
  },
};
