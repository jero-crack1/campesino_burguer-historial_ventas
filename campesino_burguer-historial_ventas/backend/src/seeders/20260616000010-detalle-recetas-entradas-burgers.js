'use strict';

// Entradas: idempotentes (solo insertan si no tienen ingredientes)
const ENTRADAS = [
  {
    nombre: 'Rellena Campesina', costo: 3669,
    ingredientes: [
      { nombre: 'Rellena',          cantidad: 150 },
      { nombre: 'Papa criolla porc', cantidad: 1   },
    ],
  },
  {
    nombre: 'Longaniza Campesina', costo: 4463,
    ingredientes: [
      { nombre: 'Longaniza',         cantidad: 100 },
      { nombre: 'Papa criolla porc', cantidad: 1   },
    ],
  },
  {
    nombre: 'Patacones Criollos', costo: 2176,
    ingredientes: [
      { nombre: 'Patacon medallon', cantidad: 192 },
      { nombre: 'Hogo',             cantidad: 1   },
    ],
  },
  {
    nombre: 'Chorizo con Arepa', costo: 3904,
    ingredientes: [
      { nombre: 'Chorizo',      cantidad: 1 },
      { nombre: 'Arepa blanca', cantidad: 1 },
    ],
  },
  {
    nombre: 'Choricriolla', costo: 5081,
    ingredientes: [
      { nombre: 'Chorizo',          cantidad: 1 },
      { nombre: 'Papa criolla porc', cantidad: 1 },
    ],
  },
  {
    nombre: 'Arepas Campesinas', costo: 5469,
    ingredientes: [
      { nombre: 'Masa peto',                cantidad: 200 },
      { nombre: 'Pechuga desmechada',       cantidad: 1   },
      { nombre: 'Sobrebarriga desmechada',  cantidad: 1   },
      { nombre: 'Sal',                      cantidad: 2   },
      { nombre: 'Sucedaneo de mantequilla', cantidad: 4   },
      { nombre: 'Chicharron',               cantidad: 1   },
      { nombre: 'Queso mozarella taj',      cantidad: 35  },
    ],
  },
  {
    nombre: 'Dorilocos', costo: 9176,
    ingredientes: [
      { nombre: 'Doritos',                 cantidad: 1  },
      { nombre: 'Pechuga desmechada',      cantidad: 1  },
      { nombre: 'Sobrebarriga desmechada', cantidad: 1  },
      { nombre: "Pico e' gallo",           cantidad: 1  },
      { nombre: 'Salsa cheddar',           cantidad: 25 },
      { nombre: 'Queso mozarella taj',     cantidad: 50 },
    ],
  },
  {
    nombre: 'Aros de Cebolla', costo: 2158,
    ingredientes: [
      { nombre: 'Aros de cebolla', cantidad: 80 },
      { nombre: 'Sour cream',      cantidad: 20 },
    ],
  },
];

// Burgers con receta correcta — reemplaza la receta genérica anterior
const BURGERS_CORRECCION = [
  {
    nombre: 'Tradición', costo: 5730,
    ingredientes: [
      { nombre: 'Carne burger',             cantidad: 1  },
      { nombre: 'Pan burger',               cantidad: 1  },
      { nombre: 'Cebolla caramelizada',     cantidad: 1  },
      { nombre: 'Salsa de la casa',         cantidad: 1  },
      { nombre: 'Queso mozarella taj',      cantidad: 25 },
      { nombre: 'Lechuga',                  cantidad: 10 },
      { nombre: 'Sucedaneo de mantequilla', cantidad: 5  },
      { nombre: 'Tomate chonto',            cantidad: 30 },
    ],
  },
  {
    nombre: 'Doble Tradición', costo: 8962,
    ingredientes: [
      { nombre: 'Carne burger doble',       cantidad: 2   },
      { nombre: 'Pan burger',               cantidad: 1   },
      { nombre: 'Cebolla caramelizada',     cantidad: 2   },
      { nombre: 'Salsa de la casa',         cantidad: 1.5 },
      { nombre: 'Queso mozarella taj',      cantidad: 50  },
      { nombre: 'Lechuga',                  cantidad: 5   },
      { nombre: 'Sucedaneo de mantequilla', cantidad: 5   },
      { nombre: 'Tomate chonto',            cantidad: 5   },
    ],
  },
  {
    nombre: 'Fusión Campesina', costo: 11175,
    ingredientes: [
      { nombre: 'Carne burger doble',       cantidad: 1   },
      { nombre: 'Pollo grille',             cantidad: 1   },
      { nombre: 'Salsa champiñones',        cantidad: 1   },
      { nombre: 'Pan burger',               cantidad: 1   },
      { nombre: 'Cebolla caramelizada',     cantidad: 2   },
      { nombre: 'Salsa de la casa',         cantidad: 1.5 },
      { nombre: 'Queso mozarella taj',      cantidad: 50  },
      { nombre: 'Lechuga',                  cantidad: 5   },
      { nombre: 'Sucedaneo de mantequilla', cantidad: 5   },
      { nombre: 'Tomate chonto',            cantidad: 5   },
    ],
  },
];

module.exports = {
  up: async (qi) => {
    const now = new Date();

    // Precargar mapa de materias primas
    const mpCache = {};
    const [allMps] = await qi.sequelize.query('SELECT id, nombre FROM materias_primas');
    for (const mp of allMps) mpCache[mp.nombre] = mp.id;

    // ── ENTRADAS (idempotente) ──────────────────────────────────────────────
    for (const rec of ENTRADAS) {
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

    // ── BURGERS CORRECCIÓN (reemplaza receta genérica) ─────────────────────
    for (const rec of BURGERS_CORRECCION) {
      const [[receta]] = await qi.sequelize.query(
        'SELECT id FROM recetas WHERE nombre = :nombre LIMIT 1',
        { replacements: { nombre: rec.nombre } }
      );
      if (!receta) { console.log(`[seed] No encontrada: ${rec.nombre}`); continue; }

      // Eliminar ingredientes anteriores (receta genérica incorrecta)
      await qi.sequelize.query(
        'DELETE FROM detalle_recetas WHERE receta_id = :id',
        { replacements: { id: receta.id } }
      );

      // Insertar ingredientes correctos
      for (const ing of rec.ingredientes) {
        const mpId = mpCache[ing.nombre];
        if (!mpId) { console.log(`[seed] MP no encontrada: ${ing.nombre}`); continue; }
        await qi.sequelize.query(
          `INSERT INTO detalle_recetas (receta_id, tipo, materia_prima_id, sub_receta_id, cantidad, created_at, updated_at)
           VALUES (:receta_id, 'materia_prima', :mp_id, NULL, :cantidad, :now, :now)`,
          { replacements: { receta_id: receta.id, mp_id: mpId, cantidad: ing.cantidad, now } }
        );
      }

      // Actualizar costo (siempre, corrigiendo el valor anterior)
      await qi.sequelize.query(
        'UPDATE recetas SET costo_produccion = :costo WHERE id = :id',
        { replacements: { costo: rec.costo, id: receta.id } }
      );
      console.log(`[seed] ✓ ${rec.nombre} corregida — costo $${rec.costo}`);
    }
  },
  down: async (qi) => {
    for (const rec of [...ENTRADAS, ...BURGERS_CORRECCION]) {
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
