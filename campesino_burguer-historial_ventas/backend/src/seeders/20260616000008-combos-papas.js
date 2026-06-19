'use strict';

const now = new Date();

// Nuevas materias primas para los combos
const MATERIAS = [
  { nombre: 'Papa francesa combo',  unidad_medida: 'unidad', precio_unitario: 801.9   },
  { nombre: 'Papa criolla porc',    unidad_medida: 'unidad', precio_unitario: 1435.9  },
  { nombre: 'Postobon 250 ml vr',   unidad_medida: 'unidad', precio_unitario: 1166.7  },
];

// Nuevas recetas (productos)
const COMBOS = [
  {
    nombre: 'Combo Papa Francesa + Gaseosa',
    precio_venta: 8000,
    costo: 2232,
    categoria: 'Adicionales',
    ingredientes: [
      { nombre: 'Papa francesa combo', cantidad: 1 },
      { nombre: 'Postobon 250 ml vr',  cantidad: 1 },
    ],
  },
  {
    nombre: 'Combo Papa Criolla + Gaseosa',
    precio_venta: 8000,
    costo: 2951,
    categoria: 'Adicionales',
    ingredientes: [
      { nombre: 'Papa criolla porc',   cantidad: 1 },
      { nombre: 'Postobon 250 ml vr',  cantidad: 1 },
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

    // Precargar ids de MPs
    const mpCache = {};
    const [allMps] = await qi.sequelize.query('SELECT id, nombre FROM materias_primas');
    for (const mp of allMps) mpCache[mp.nombre] = mp.id;

    // 2. Recetas + DetalleRecetas
    for (const combo of COMBOS) {
      const [[{ count }]] = await qi.sequelize.query(
        'SELECT COUNT(*) as count FROM recetas WHERE nombre = :nombre',
        { replacements: { nombre: combo.nombre } }
      );

      let recetaId;
      if (parseInt(count) === 0) {
        const [[inserted]] = await qi.sequelize.query(
          `INSERT INTO recetas (nombre, unidad_produccion, cantidad_produccion, stock_actual, precio_venta, costo_produccion, categoria, created_at, updated_at)
           VALUES (:nombre, 'unidad', 1, 20, :precio_venta, :costo, :categoria, :now, :now)
           RETURNING id`,
          { replacements: { nombre: combo.nombre, precio_venta: combo.precio_venta, costo: combo.costo, categoria: combo.categoria, now } }
        );
        recetaId = inserted.id;
        console.log(`[seed] ✓ Receta creada: ${combo.nombre}`);
      } else {
        const [[existing]] = await qi.sequelize.query(
          'SELECT id FROM recetas WHERE nombre = :nombre LIMIT 1',
          { replacements: { nombre: combo.nombre } }
        );
        recetaId = existing.id;
      }

      // Insertar ingredientes si no existen
      const [[{ countDet }]] = await qi.sequelize.query(
        'SELECT COUNT(*) as "countDet" FROM detalle_recetas WHERE receta_id = :id',
        { replacements: { id: recetaId } }
      );
      if (parseInt(countDet) > 0) continue;

      for (const ing of combo.ingredientes) {
        const mpId = mpCache[ing.nombre];
        if (!mpId) continue;
        await qi.sequelize.query(
          `INSERT INTO detalle_recetas (receta_id, tipo, materia_prima_id, sub_receta_id, cantidad, created_at, updated_at)
           VALUES (:receta_id, 'materia_prima', :mp_id, NULL, :cantidad, :now, :now)`,
          { replacements: { receta_id: recetaId, mp_id: mpId, cantidad: ing.cantidad, now } }
        );
      }
      console.log(`[seed] ✓ Ingredientes cargados: ${combo.nombre}`);
    }
  },
  down: async (qi) => {
    for (const combo of COMBOS) {
      const [[receta]] = await qi.sequelize.query(
        'SELECT id FROM recetas WHERE nombre = :nombre LIMIT 1',
        { replacements: { nombre: combo.nombre } }
      );
      if (!receta) continue;
      await qi.sequelize.query('DELETE FROM detalle_recetas WHERE receta_id = :id', { replacements: { id: receta.id } });
      await qi.sequelize.query('DELETE FROM recetas WHERE id = :id', { replacements: { id: receta.id } });
    }
    const nombres = MATERIAS.map((m) => `'${m.nombre}'`).join(', ');
    await qi.sequelize.query(`DELETE FROM materias_primas WHERE nombre IN (${nombres})`);
  },
};
