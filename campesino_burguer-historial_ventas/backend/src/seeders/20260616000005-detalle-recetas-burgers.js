'use strict';

// Receta estándar compartida por todas las hamburguesas
const INGREDIENTES = [
  { nombre: 'Carne burger',             cantidad: 1  },
  { nombre: 'Pan burger',               cantidad: 1  },
  { nombre: 'Tocineta',                 cantidad: 50 },
  { nombre: 'Pepinillos',               cantidad: 25 },
  { nombre: 'Salsa de cheddar',         cantidad: 1  },
  { nombre: 'Salsa de la casa',         cantidad: 1  },
  { nombre: 'Queso mozarella taj',      cantidad: 25 },
  { nombre: 'Cebolla caramelizada',     cantidad: 1  },
  { nombre: 'Sucedaneo de mantequilla', cantidad: 5  },
];

const BURGERS = [
  'Doble Tradición',
  'Fusión Campesina',
  "Chicken's Campirana",
  'Arrebatada',
  'Mastersina',
  'Colombiana',
  'Campesino Burger',
  'Bacon del Campo',
];

module.exports = {
  up: async (qi) => {
    const now = new Date();

    // Precargar ids de materias primas de una sola vez
    const mpMap = {};
    for (const ing of INGREDIENTES) {
      const [[mp]] = await qi.sequelize.query(
        'SELECT id FROM materias_primas WHERE nombre = :nombre LIMIT 1',
        { replacements: { nombre: ing.nombre } }
      );
      if (mp) mpMap[ing.nombre] = mp.id;
    }

    for (const nombreBurger of BURGERS) {
      const [[receta]] = await qi.sequelize.query(
        'SELECT id FROM recetas WHERE nombre = :nombre LIMIT 1',
        { replacements: { nombre: nombreBurger } }
      );
      if (!receta) continue;

      // Si ya tiene detalles, saltar
      const [[{ count }]] = await qi.sequelize.query(
        'SELECT COUNT(*) as count FROM detalle_recetas WHERE receta_id = :id',
        { replacements: { id: receta.id } }
      );
      if (parseInt(count) > 0) continue;

      for (const ing of INGREDIENTES) {
        const mpId = mpMap[ing.nombre];
        if (!mpId) continue;

        await qi.sequelize.query(
          `INSERT INTO detalle_recetas (receta_id, tipo, materia_prima_id, sub_receta_id, cantidad, created_at, updated_at)
           VALUES (:receta_id, 'materia_prima', :mp_id, NULL, :cantidad, :now, :now)`,
          { replacements: { receta_id: receta.id, mp_id: mpId, cantidad: ing.cantidad, now } }
        );
      }

      console.log(`[seed] Ingredientes cargados → ${nombreBurger}`);
    }
  },
  down: async (qi) => {
    for (const nombreBurger of BURGERS) {
      const [[receta]] = await qi.sequelize.query(
        'SELECT id FROM recetas WHERE nombre = :nombre LIMIT 1',
        { replacements: { nombre: nombreBurger } }
      );
      if (!receta) continue;
      await qi.sequelize.query(
        'DELETE FROM detalle_recetas WHERE receta_id = :id',
        { replacements: { id: receta.id } }
      );
    }
  },
};
