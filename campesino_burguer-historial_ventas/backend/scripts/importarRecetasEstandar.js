const XLSX = require('xlsx');

const EXCEL_PATH = 'C:\\Users\\DELL\\Downloads\\Recetas Estandar (Nuevas).xlsx';
const API_URL = 'https://campesino-burguer-api.onrender.com/api';
const CREDS = { username: 'admin', password: '1013265371' };

// ─── Helpers ───────────────────────────────────────────────────────────────

let token;

async function apiGet(path) {
  const r = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}`);
  return r.json();
}

async function apiPost(path, body) {
  const r = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(data));
  return data;
}

function normalize(s) {
  return String(s || '').trim().toLowerCase();
}

function buildMap(items, keyFn) {
  const m = new Map();
  for (const item of items) m.set(normalize(keyFn(item)), item);
  return m;
}

// ─── Parseo Materias Primas del Excel ──────────────────────────────────────

function parseMateriasPrimasExcel() {
  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets['Materias Primas'];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  return rows.map(r => ({
    nombre: String(r['PRODUCTO'] || '').trim(),
    costo_paquete: parseFloat(r['VALOR'] || 0),
    cantidad_paquete: parseFloat(r['MEDIDA'] || 0),
    unidad_medida: String(r['UNIDADMEDIDA'] || '').trim(),
    precio_unitario: parseFloat(r['VALOR \nUNITARIO'] || r['VALOR UNITARIO'] || 0),
    stock_actual: 0,
    stock_minimo: 0,
  })).filter(r => r.nombre);
}

// ─── Parseo Sub Recetas del Excel ──────────────────────────────────────────

// Palabras que indican filas que NO son ingredientes
const SKIP_KEYWORDS = [
  'costo total', 'margen de error', 'costo de una', 'costo por gramo',
  'rendimiento final', 'ingredientes', 'analisis', 'sub receta:',
  'porcion:', 'peso porcion:', '$ compra:', '$ precio',
];

function shouldSkip(cellValue) {
  const v = normalize(cellValue);
  if (!v) return true;
  return SKIP_KEYWORDS.some(k => v.includes(k));
}

/**
 * Parsea un bloque de sub-receta que comienza en la fila startRow con columna base offset.
 *
 * Estructura del Excel (ejemplo offset=1):
 *   col[1]="SUB RECETA:", col[2]=nombre
 *   col[1]="Porcion:", col[2]=porciones, col[3]="Peso porcion:", col[4]=peso, col[5]=unidad
 *   col[1]="INGREDIENTES", col[2]="UNIDAD", col[3]="CANTIDAD", ...   ← fila de cabeceras
 *   col[1]=nombre_ing, col[2]=unidad_ing, col[3]=cantidad_ing        ← filas de ingredientes
 *   col[1]="COSTO TOTAL ...", ...                                     ← filas de resumen
 */
function parseSubRecetaBlock(rows, startRow, offset) {
  const headerRow = rows[startRow];
  const nombre = String(headerRow[offset + 1] || '').trim();
  if (!nombre) return null;

  const porcionRow = rows[startRow + 1];
  const porciones = parseFloat(porcionRow[offset + 1]) || 1;
  const pesoPorcion = parseFloat(porcionRow[offset + 3]) || 1;
  const unidad = normalize(porcionRow[offset + 4] || 'gr');
  const cantidad_produccion = parseFloat((porciones * pesoPorcion).toFixed(3));

  const ingredientes = [];

  for (let i = startRow + 3; i < rows.length; i++) {
    const row = rows[i];
    // PARAR si empieza otra sub-receta en esta misma columna
    if (normalize(row[offset]) === 'sub receta:') break;

    const ingName = String(row[offset] || '').trim();
    const ingCantidad = parseFloat(row[offset + 2]);

    if (shouldSkip(ingName)) continue;
    if (isNaN(ingCantidad) || ingCantidad <= 0) continue;

    ingredientes.push({ nombre: ingName, cantidad: ingCantidad });
  }

  return { nombre, cantidad_produccion, unidad_produccion: unidad, pesoPorcion, ingredientes };
}

function parseSubRecetasExcel() {
  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets['Sub Recetas'];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1 });

  const subRecetas = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (const offset of [1, 7, 13]) {
      if (normalize(row[offset]) !== 'sub receta:') continue;
      const sr = parseSubRecetaBlock(rows, i, offset);
      if (sr) subRecetas.push(sr);
    }
  }

  // Desambiguar nombres duplicados usando el peso de porción
  const nameCounts = {};
  for (const sr of subRecetas) nameCounts[normalize(sr.nombre)] = (nameCounts[normalize(sr.nombre)] || 0) + 1;
  for (const sr of subRecetas) {
    if (nameCounts[normalize(sr.nombre)] > 1) {
      sr.nombre = `${sr.nombre} ${Math.round(sr.pesoPorcion)}gr`;
    }
  }

  return subRecetas;
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(CREDS),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) { console.error('Login fallido:', loginData); process.exit(1); }
  token = loginData.token;
  console.log('Login exitoso.\n');

  // ── PASO 1: Nuevas materias primas ──────────────────────────────────────
  console.log('═══════════════════════════════════════');
  console.log('  PASO 1: Materias Primas nuevas');
  console.log('═══════════════════════════════════════');

  const mpExcel = parseMateriasPrimasExcel();
  const mpDB = await apiGet('/materias-primas');
  const mpMap = buildMap(mpDB, mp => mp.nombre);

  const extrasSubRecetas = [
    { nombre: 'Pimienta',           unidad_medida: 'g',   precio_unitario: 292.5,  costo_paquete: 0, cantidad_paquete: 0 },
    { nombre: 'Zanahoria',          unidad_medida: 'g',   precio_unitario: 3.6,    costo_paquete: 0, cantidad_paquete: 0 },
    { nombre: 'Pechuga deshuesada', unidad_medida: 'g',   precio_unitario: 18.92,  costo_paquete: 0, cantidad_paquete: 0 },
    { nombre: 'Manteca cerdo',      unidad_medida: 'mL',  precio_unitario: 6.225,  costo_paquete: 0, cantidad_paquete: 0 },
    { nombre: 'Pimenton morron',    unidad_medida: 'g',   precio_unitario: 6.07,   costo_paquete: 0, cantidad_paquete: 0 },
    { nombre: 'Ron',                unidad_medida: 'mL',  precio_unitario: 43.93,  costo_paquete: 0, cantidad_paquete: 0 },
    { nombre: 'Queso cheddar',      unidad_medida: 'g',   precio_unitario: 23.2,   costo_paquete: 0, cantidad_paquete: 0 },
    { nombre: 'Fondo',              unidad_medida: 'mL',  precio_unitario: 10.91,  costo_paquete: 0, cantidad_paquete: 0 },
    { nombre: 'Alas',               unidad_medida: 'g',   precio_unitario: 9,      costo_paquete: 0, cantidad_paquete: 0 },
    { nombre: 'Color',              unidad_medida: 'g',   precio_unitario: 23.75,  costo_paquete: 0, cantidad_paquete: 0 },
    { nombre: 'Vinagre de manzana', unidad_medida: 'mL',  precio_unitario: 17.4,   costo_paquete: 0, cantidad_paquete: 0 },
  ];

  const toCreate = [];
  for (const mp of [...mpExcel, ...extrasSubRecetas]) {
    if (!mpMap.has(normalize(mp.nombre)) && !toCreate.some(x => normalize(x.nombre) === normalize(mp.nombre))) {
      toCreate.push({ ...mp, stock_actual: 0, stock_minimo: 0 });
    }
  }

  if (toCreate.length === 0) {
    console.log('No hay materias primas nuevas.\n');
  } else {
    console.log(`Registrando ${toCreate.length} nuevas...\n`);
    let ok = 0;
    for (const mp of toCreate) {
      try {
        const created = await apiPost('/materias-primas', mp);
        console.log(`  [OK] "${mp.nombre}" (id: ${created.id})`);
        mpMap.set(normalize(mp.nombre), created);
        ok++;
      } catch (e) {
        console.error(`  [ERROR] "${mp.nombre}": ${e.message}`);
      }
    }
    console.log(`\nMaterias primas nuevas: ${ok}\n`);
  }

  const mpActualizadas = await apiGet('/materias-primas');
  const mpFinal = buildMap(mpActualizadas, mp => mp.nombre);

  // ── PASO 2: Sub Recetas ──────────────────────────────────────────────────
  console.log('═══════════════════════════════════════');
  console.log('  PASO 2: Sub Recetas');
  console.log('═══════════════════════════════════════\n');

  const subRecetasExcel = parseSubRecetasExcel();
  console.log(`Sub recetas en el Excel: ${subRecetasExcel.length}\n`);

  const srExistentes = await apiGet('/sub-recetas');
  const srMap = buildMap(srExistentes, sr => sr.nombre);

  // Sub-recetas que son usadas como ingredientes por otras
  const SUB_RECETA_INGREDIENTES = ['adobo'];

  const sinDep = subRecetasExcel.filter(sr =>
    !sr.ingredientes.some(ing => SUB_RECETA_INGREDIENTES.includes(normalize(ing.nombre)))
  );
  const conDep = subRecetasExcel.filter(sr =>
    sr.ingredientes.some(ing => SUB_RECETA_INGREDIENTES.includes(normalize(ing.nombre)))
  );

  let srOk = 0, srFail = 0, srOmitido = 0;

  for (const sr of [...sinDep, ...conDep]) {
    if (srMap.has(normalize(sr.nombre))) {
      console.log(`  [OMITIDO] "${sr.nombre}" ya existe.`);
      srOmitido++;
      continue;
    }

    const ingredientesResueltos = [];
    const noResueltos = [];

    for (const ing of sr.ingredientes) {
      const key = normalize(ing.nombre);

      const mp = mpFinal.get(key);
      if (mp) { ingredientesResueltos.push({ materia_prima_id: mp.id, cantidad: ing.cantidad }); continue; }

      const srIng = srMap.get(key);
      if (srIng) { ingredientesResueltos.push({ materia_prima_id: null, sub_receta_ingrediente_id: srIng.id, cantidad: ing.cantidad }); continue; }

      // Fuzzy match solo si la clave tiene más de 3 caracteres (evita "gr", "ml", etc.)
      if (key.length > 3) {
        let found = null;
        for (const [dbKey, dbMp] of mpFinal) {
          if (dbKey.includes(key) || key.includes(dbKey)) { found = dbMp; break; }
        }
        if (found) {
          console.log(`    [FUZZY] "${ing.nombre}" → "${found.nombre}"`);
          ingredientesResueltos.push({ materia_prima_id: found.id, cantidad: ing.cantidad });
          continue;
        }
      }

      noResueltos.push(ing.nombre);
    }

    if (noResueltos.length > 0) {
      console.warn(`  [WARN] "${sr.nombre}": no encontrados → ${noResueltos.join(', ')}`);
    }

    if (ingredientesResueltos.length === 0) {
      console.error(`  [ERROR] "${sr.nombre}": sin ingredientes, se omite.`);
      srFail++;
      continue;
    }

    try {
      const creada = await apiPost('/sub-recetas', {
        nombre: sr.nombre,
        unidad_produccion: sr.unidad_produccion,
        cantidad_produccion: sr.cantidad_produccion,
        ingredientes: ingredientesResueltos,
      });
      console.log(`  [OK] "${sr.nombre}" → id:${creada.id} | produce:${sr.cantidad_produccion}${sr.unidad_produccion} | ingredientes:${ingredientesResueltos.length}`);
      srMap.set(normalize(sr.nombre), creada);
      srOk++;
    } catch (e) {
      console.error(`  [ERROR] "${sr.nombre}": ${e.message}`);
      srFail++;
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('  RESUMEN');
  console.log('═══════════════════════════════════════');
  console.log(`  Sub recetas creadas  : ${srOk}`);
  console.log(`  Sub recetas omitidas : ${srOmitido}`);
  console.log(`  Sub recetas fallidas : ${srFail}`);
}

main().catch(err => { console.error('Error fatal:', err); process.exit(1); });
