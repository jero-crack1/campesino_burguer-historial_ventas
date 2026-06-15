/**
 * fixSubRecetasData.js
 *
 * Ejecutar DESPUÉS de que el deploy en Render haya corrido la migración
 * 20260615000020-add-porciones-to-sub-recetas.
 *
 * Hace tres cosas:
 *  1. Corrige ingredientes de Papa francesa salc campo (id:30) → 4 correctos
 *  2. Corrige ingredientes de Carne burger 100gr (id:39) → 5 correctos (quita Pimenton morron)
 *  3. Actualiza porciones / peso_porcion / costo_porcion y normaliza unidad_produccion en todas
 */

const API_URL = 'https://campesino-burguer-api.onrender.com/api';
const CREDS = { username: 'admin', password: '1013265371' };

let token;

async function apiGet(path) {
  const r = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}`);
  return r.json();
}

async function apiPut(path, body) {
  const r = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(data));
  return data;
}

function norm(s) { return String(s || '').trim().toLowerCase(); }

// ── Porciones / peso / costo por sub receta (del Excel) ────────────────────
const PORCIONES_DATA = [
  { nombre: 'Cebolla Caramelizada',       porciones: 21.5,        peso_porcion: 20,   costo_porcion: 126.43  },
  { nombre: 'Hogo',                        porciones: 15.9,        peso_porcion: 40,   costo_porcion: 307.94  },
  { nombre: 'Papa francesa COMBO',         porciones: 1,           peso_porcion: 150,  costo_porcion: 801.89  },
  { nombre: 'Papa criolla COMBO',          porciones: 1,           peso_porcion: 150,  costo_porcion: 1435.89 },
  { nombre: 'Papa francesa Grande',        porciones: 1,           peso_porcion: 180,  costo_porcion: 869.28  },
  { nombre: 'Papa francesa salc campo',    porciones: 1,           peso_porcion: 220,  costo_porcion: 1144.02 },
  { nombre: 'Papa francesa salc tradicion',porciones: 1,           peso_porcion: 250,  costo_porcion: 1290.64 },
  { nombre: 'Pollo grille',                porciones: 20.62,       peso_porcion: 150,  costo_porcion: 3066.84 },
  { nombre: 'Alas',                        porciones: 4.0857,      peso_porcion: 210,  costo_porcion: 2951.71 },
  { nombre: 'Pechuga Asada',               porciones: 1.926272,    peso_porcion: 250,  costo_porcion: 5269.85 },
  { nombre: 'Pechuga Desmechada',          porciones: 25.711,      peso_porcion: 45,   costo_porcion: 1312.07 },
  { nombre: 'Sobrebarriga desmechada',     porciones: 22.457,      peso_porcion: 35,   costo_porcion: 1354.60 },
  { nombre: 'Chicharron',                  porciones: 8.2,         peso_porcion: 10,   costo_porcion: 754.92  },
  { nombre: 'Adobo',                       porciones: 11.7,        peso_porcion: 10,   costo_porcion: 259.25  },
  { nombre: 'Salsa champiñones',           porciones: 42.22,       peso_porcion: 50,   costo_porcion: 1641.38 },
  { nombre: 'Carne burger 160gr',          porciones: 34.6875,     peso_porcion: 160,  costo_porcion: 3150.85 },
  { nombre: 'Carne burger 100gr',          porciones: 55.5,        peso_porcion: 100,  costo_porcion: 1969.28 },
  { nombre: 'Salsa de la casa',            porciones: 300,         peso_porcion: 20,   costo_porcion: 153.92  },
  { nombre: 'Pimentones caramelizados',    porciones: 13.95,       peso_porcion: 20,   costo_porcion: 236.49  },
  { nombre: 'Salsa de cheddar',            porciones: 45.875,      peso_porcion: 80,   costo_porcion: 990.93  },
  { nombre: "Pico e´ gallo",              porciones: 2.352,       peso_porcion: 25,   costo_porcion: 444.86  },
  { nombre: 'Chimichurri',                 porciones: 48.153,      peso_porcion: 30,   costo_porcion: 243.62  },
  { nombre: 'Limonada 14 oz',             porciones: 1,           peso_porcion: 434,  costo_porcion: 820.07  },
];

// ── Ingredientes correctos para las sub recetas con errores ─────────────────
// (los nombres se resolverán a IDs buscando en la lista de materias primas)
const INGREDIENTES_FIX = {
  'Papa francesa salc campo': [
    { mp: 'Papa pastusa', cantidad: 220 },
    { mp: 'Ajo en polvo', cantidad: 1   },
    { mp: 'Sal',          cantidad: 2   },
    { mp: 'Aceite',       cantidad: 55  },
  ],
  'Carne burger 100gr': [
    { mp: 'Murillo',      cantidad: 3906.25 },
    { mp: 'Pecho',        cantidad: 1093.75 },
    { mp: 'Tocineta',     cantidad: 70      },
    { mp: 'Sal marina',   cantidad: 80      },
    { mp: 'Salsa negra',  cantidad: 400     },
  ],
};

async function main() {
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(CREDS),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) { console.error('Login fallido:', loginData); process.exit(1); }
  token = loginData.token;
  console.log('Login exitoso.\n');

  const [allMps, allSrs] = await Promise.all([
    apiGet('/materias-primas'),
    apiGet('/sub-recetas'),
  ]);

  const mpMap = new Map(allMps.map(m => [norm(m.nombre), m]));
  const srMap = new Map(allSrs.map(s => [norm(s.nombre), s]));

  // ── PASO 1: Corregir ingredientes ─────────────────────────────────────────
  console.log('════════════════════════════════════════');
  console.log('  PASO 1: Corrección de ingredientes');
  console.log('════════════════════════════════════════\n');

  for (const [srNombre, fixList] of Object.entries(INGREDIENTES_FIX)) {
    const sr = srMap.get(norm(srNombre));
    if (!sr) { console.warn(`  [WARN] "${srNombre}" no encontrada en BD.`); continue; }

    const ingredientes = [];
    for (const { mp, cantidad } of fixList) {
      const found = mpMap.get(norm(mp));
      if (!found) {
        // fuzzy
        let fuzzy = null;
        for (const [k, v] of mpMap) { if (k.includes(norm(mp)) || norm(mp).includes(k)) { fuzzy = v; break; } }
        if (!fuzzy) { console.warn(`    [WARN] Materia prima "${mp}" no encontrada.`); continue; }
        console.log(`    [FUZZY] "${mp}" → "${fuzzy.nombre}"`);
        ingredientes.push({ materia_prima_id: fuzzy.id, cantidad });
      } else {
        ingredientes.push({ materia_prima_id: found.id, cantidad });
      }
    }

    if (ingredientes.length === 0) { console.error(`  [ERROR] Sin ingredientes para "${srNombre}"`); continue; }

    try {
      await apiPut(`/sub-recetas/${sr.id}`, { ingredientes });
      console.log(`  [OK] "${srNombre}" → ${ingredientes.length} ingredientes corregidos`);
    } catch (e) {
      console.error(`  [ERROR] "${srNombre}": ${e.message}`);
    }
  }

  // ── PASO 2: Actualizar porciones, peso_porcion, costo_porcion ─────────────
  console.log('\n════════════════════════════════════════');
  console.log('  PASO 2: Porciones y costos');
  console.log('════════════════════════════════════════\n');

  let ok = 0, fail = 0;

  for (const data of PORCIONES_DATA) {
    const sr = srMap.get(norm(data.nombre));
    if (!sr) { console.warn(`  [WARN] "${data.nombre}" no encontrada en BD.`); fail++; continue; }

    // Normalizar unidad: gr→g, ml→mL
    const unidadNorm = sr.unidad_produccion === 'gr' ? 'g' : sr.unidad_produccion === 'ml' ? 'mL' : sr.unidad_produccion;

    try {
      await apiPut(`/sub-recetas/${sr.id}`, {
        porciones: data.porciones,
        peso_porcion: data.peso_porcion,
        costo_porcion: data.costo_porcion,
        unidad_produccion: unidadNorm,
      });
      console.log(`  [OK] "${data.nombre}" → ${data.porciones} porc × ${data.peso_porcion}${unidadNorm} | $${data.costo_porcion}/porc`);
      ok++;
    } catch (e) {
      console.error(`  [ERROR] "${data.nombre}": ${e.message}`);
      fail++;
    }
  }

  console.log('\n════════════════════════════════════════');
  console.log('  RESUMEN');
  console.log('════════════════════════════════════════');
  console.log(`  Porciones actualizadas : ${ok}`);
  console.log(`  Fallidas               : ${fail}`);
}

main().catch(err => { console.error('Error fatal:', err); process.exit(1); });
