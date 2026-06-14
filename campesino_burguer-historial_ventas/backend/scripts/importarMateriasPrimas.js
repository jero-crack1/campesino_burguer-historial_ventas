const XLSX = require('xlsx');
const path = require('path');

const EXCEL_PATH = 'C:\\Users\\DELL\\Downloads\\Materia Prima.xlsx';
const API_URL = 'https://campesino-burguer-api.onrender.com/api';
const CREDENTIALS = { username: 'admin', password: '1013265371' };

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(CREDENTIALS),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login fallido: ${data.error || res.statusText}`);
  return data.token;
}

function leerExcel() {
  const workbook = XLSX.readFile(EXCEL_PATH);
  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(hoja, { defval: '' });
}

function mapearFila(fila) {
  return {
    nombre:           String(fila['PRODUCTO']       || '').trim(),
    costo_paquete:    parseFloat(fila['COSTO']      || 0),
    cantidad_paquete: parseFloat(fila['MEDIDA']     || 0),
    unidad_medida:    String(fila['UNIDAD MEDIDA']  || '').trim(),
    precio_unitario:  parseFloat(fila['COSTO UNITARIO'] || 0),
    stock_actual: 0,
    stock_minimo: 0,
  };
}

async function importar() {
  console.log('Iniciando importación de Materias Primas...\n');

  let token;
  try {
    token = await login();
    console.log('Login exitoso.\n');
  } catch (err) {
    console.error(`Error de autenticación: ${err.message}`);
    process.exit(1);
  }

  const filas = leerExcel();
  console.log(`Filas encontradas en el Excel: ${filas.length}\n`);

  let exitosos = 0;
  let fallidos = 0;

  for (let i = 0; i < filas.length; i++) {
    const materia = mapearFila(filas[i]);

    if (!materia.nombre) {
      console.warn(`Fila ${i + 2}: sin nombre, se omite.`);
      fallidos++;
      continue;
    }

    try {
      const res = await fetch(`${API_URL}/materias-primas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(materia),
      });

      const data = await res.json();

      if (res.ok) {
        console.log(`[OK] Fila ${i + 2}: "${materia.nombre}" registrada (id: ${data.id})`);
        exitosos++;
      } else {
        console.error(`[ERROR] Fila ${i + 2}: "${materia.nombre}" — ${data.error || JSON.stringify(data)}`);
        fallidos++;
      }
    } catch (err) {
      console.error(`[ERROR] Fila ${i + 2}: "${materia.nombre}" — ${err.message}`);
      fallidos++;
    }
  }

  console.log(`\nImportación finalizada.`);
  console.log(`  Exitosos : ${exitosos}`);
  console.log(`  Fallidos : ${fallidos}`);
}

importar();
