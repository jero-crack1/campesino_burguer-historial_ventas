'use strict';

// Ingredientes con sus cantidades para Burger Tradición
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

// Costo total de preparación según receta estándar
const COSTO_PRODUCCION = 8232;

module.exports = {
  up: async (qi) => {
    // Buscar la receta Tradición
    const [[receta]] = await qi.sequelize.query(
      "SELECT id FROM recetas WHERE nombre = 'Tradición' LIMIT 1"
    );
    if (!receta) return;

    // Si ya tiene detalles, no duplicar
    const [[{ count }]] = await qi.sequelize.query(
      'SELECT COUNT(*) as count FROM detalle_recetas WHERE receta_id = :id',
      { replacements: { id: receta.id } }
    );
    if (parseInt(count) > 0) {
      // Solo actualizar costo si está en 0
      await qi.sequelize.query(
        'UPDATE recetas SET costo_produccion = :costo WHERE id = :id AND costo_produccion = 0',
        { replacements: { costo: COSTO_PRODUCCION, id: receta.id } }
      );
      return;
    }

    const now = new Date();

    // Insertar DetalleReceta por cada ingrediente
    for (const ing of INGREDIENTES) {
      const [[mp]] = await qi.sequelize.query(
        'SELECT id FROM materias_primas WHERE nombre = :nombre LIMIT 1',
        { replacements: { nombre: ing.nombre } }
      );
      if (!mp) continue;

      await qi.sequelize.query(
        `INSERT INTO detalle_recetas (receta_id, tipo, materia_prima_id, sub_receta_id, cantidad, created_at, updated_at)
         VALUES (:receta_id, 'materia_prima', :mp_id, NULL, :cantidad, :now, :now)`,
        { replacements: { receta_id: receta.id, mp_id: mp.id, cantidad: ing.cantidad, now } }
      );
    }

    // Actualizar costo de producción
    await qi.sequelize.query(
      'UPDATE recetas SET costo_produccion = :costo WHERE id = :id',
      { replacements: { costo: COSTO_PRODUCCION, id: receta.id } }
    );
  },
  down: async (qi) => {
    const [[receta]] = await qi.sequelize.query(
      "SELECT id FROM recetas WHERE nombre = 'Tradición' LIMIT 1"
    );
    if (!receta) return;
    await qi.sequelize.query(
      'DELETE FROM detalle_recetas WHERE receta_id = :id',
      { replacements: { id: receta.id } }
    );
    await qi.sequelize.query(
      'UPDATE recetas SET costo_produccion = 0 WHERE id = :id',
      { replacements: { id: receta.id } }
    );
  },
};
