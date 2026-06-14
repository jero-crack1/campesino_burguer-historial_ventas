'use strict';

const now = new Date();

const img = {
  // Burgers
  b1: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=375&fit=crop&auto=format',
  b2: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&h=375&fit=crop&auto=format',
  b3: 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=500&h=375&fit=crop&auto=format',
  b4: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=500&h=375&fit=crop&auto=format',
  b5: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&h=375&fit=crop&auto=format',
  b6: 'https://images.unsplash.com/photo-1571087854168-b7d90e3a6c3f?w=500&h=375&fit=crop&auto=format',
  b7: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&h=375&fit=crop&auto=format',
  b8: 'https://images.unsplash.com/photo-1572802419509-b7e4c5dc61c8?w=500&h=375&fit=crop&auto=format',
  b9: 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=500&h=375&fit=crop&auto=format',
  // Hot dogs
  hd1: 'https://images.unsplash.com/photo-1612392062631-94dc2dd4c1a5?w=500&h=375&fit=crop&auto=format',
  hd2: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&h=375&fit=crop&auto=format',
  hd3: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=375&fit=crop&auto=format',
  // Grilled
  g1: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&h=375&fit=crop&auto=format',
  g2: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=500&h=375&fit=crop&auto=format',
  g3: 'https://images.unsplash.com/photo-1544025934-04f8f3ae2c63?w=500&h=375&fit=crop&auto=format',
  // Others
  wings:      'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=500&h=375&fit=crop&auto=format',
  fries:      'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&h=375&fit=crop&auto=format',
  onion:      'https://images.unsplash.com/photo-1639024471283-03518883512d?w=500&h=375&fit=crop&auto=format',
  pizza:      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=375&fit=crop&auto=format',
  juice:      'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500&h=375&fit=crop&auto=format',
  drinks:     'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=500&h=375&fit=crop&auto=format',
  beer:       'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500&h=375&fit=crop&auto=format',
  soda:       'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&h=375&fit=crop&auto=format',
  nachos:     'https://images.unsplash.com/photo-1600952841320-db92ec4047ca?w=500&h=375&fit=crop&auto=format',
  sausage:    'https://images.unsplash.com/photo-1558030006-450675393462?w=500&h=375&fit=crop&auto=format',
  corn:       'https://images.unsplash.com/photo-1601598851547-4302969d0614?w=500&h=375&fit=crop&auto=format',
  arepa:      'https://images.unsplash.com/photo-1624304197821-0c0a54a397e9?w=500&h=375&fit=crop&auto=format',
  plantain:   'https://images.unsplash.com/photo-1574673592693-8d11dbc1e99e?w=500&h=375&fit=crop&auto=format',
  sides:      'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=500&h=375&fit=crop&auto=format',
  sauce:      'https://images.unsplash.com/photo-1472476443507-c7dcb5fa59fc?w=500&h=375&fit=crop&auto=format',
};

const row = (nombre, precio_venta, descripcion, imagen_url) => ({
  nombre,
  descripcion: descripcion || null,
  unidad_produccion: 'unidad',
  cantidad_produccion: 1.000,
  stock_actual: 20.000,
  precio_venta,
  costo_produccion: 0.00,
  imagen_url,
  created_at: now,
  updated_at: now,
});

const PRODUCTOS = [
  // ── ENTRADAS ────────────────────────────────────────────────────────────────
  row('Rellena Campesina',   15000, 'Acompañada de papa criolla 100% artesanal.',                                                                                                    img.sausage),
  row('Longaniza Campesina', 15000, 'Acompañada de papa criolla 100% artesanal.',                                                                                                    img.sausage),
  row('Patacones Criollos',  14000, '5 unidades de patacones gratinados con hogo.',                                                                                                  img.plantain),
  row('Chorizo con Arepa',    9000, null,                                                                                                                                            img.sausage),
  row('Choricriolla',        14000, 'Chorizo acompañado de papa criolla.',                                                                                                           img.sausage),
  row('Arepas Campesinas',   14000, 'Arepa de 100% maíz peto rellena de sobrebarriga y pollo desmechado, chicharrón y queso. (30 min la preparación)',                              img.arepa),
  row('Dorilocos',           18000, 'Doritos acompañados de sobrebarriga y pollo desmechado, pico e\'gallo, queso tipo mozarrella y salsa cheddar.',                                img.nachos),
  row('Aros de Cebolla',     10000, 'Acompañados de sour cream.',                                                                                                                   img.onion),

  // ── BURGERS ─────────────────────────────────────────────────────────────────
  row('Tradición',            19000, 'Carne artesanal (160gr), lechuga, tomate, cebolla caramelizada, mozarela y salsa de la casa.',                                                 img.b1),
  row('Doble Tradición',      26000, 'Doble porción de carne artesanal (160gr), lechuga, tomate, doble cebolla caramelizada, doble mozarela y salsa de la casa.',                   img.b6),
  row('Fusión Campesina',     30000, 'Carne artesanal (160gr), pollo parrilla (150gr), salsa de champiñones, lechuga, tomate, doble cebolla caramelizada, doble mozarela fundido y salsa de la casa.', img.b3),
  row("Chicken's Campirana",  24000, 'Pollo parrilla (150gr), salsa de champiñones, lechuga, tomate, cebolla caramelizada, mozarela y salsa de la casa.',                           img.b4),
  row('Arrebatada',           25000, 'Carne artesanal (160gr), salsa picantosa, jalapeños, lechuga, tomate, tocineta, totopos, cebolla caramelizada, mozarela fundido y salsa de la casa.', img.b5),
  row('Mastersina',           29000, 'Carne artesanal (160gr), crumble de tocineta, pimentones ahumados y caramelizados en ron, lechuga, chorizo y mozzarela fundido.',             img.b7),
  row('Colombiana',           30000, 'Carne artesanal (160gr), salsa colombiana (maíz, tocineta, champiñón), plátano maduro, tocineta, lechuga, tomate, cebolla caramelizada, mozarela y salsa de la casa.', img.b2),
  row('Campesino Burger',     30000, 'Carne artesanal (160gr) envuelta en tocineta, huevo frito, salsa criolla (guiso de tomate y cebolla), aguacate, lechuga, tomate, mozarela y salsa de la casa.', img.b8),
  row('Bacon del Campo',      32000, 'Carne artesanal (160gr), tocineta, cebolla caramelizada, pepinillos, mozarela fundido y salsa de la casa. Todo bañado en salsa cheddar y trozos crujientes de tocineta.', img.b9),

  // ── PATACON ─────────────────────────────────────────────────────────────────
  row('Patacón Arriero',      30000, 'Sobrebarriga y pollo mechado, chorizo, chicharrón, huevos de codorniz, mozzarela fundido, hogo, salsa de la casa y papas ripio, todo sobre un gran patacón.', img.plantain),

  // ── SALCHIPAPAS ─────────────────────────────────────────────────────────────
  row('Salchipapa Tradición', 17000, 'Salchicha americana, papa francesa de la casa y mozarela fundido.',                                                                            img.fries),
  row('Salchipapa del Campo', 30000, 'Salchicha americana, papa francesa de la casa, sobrebarriga y pollo mechado, chorizo, chicharrón, salsa de la casa, huevos de codorniz, mozarela fundido y papas ripio.', img.fries),

  // ── MAZORCADA ───────────────────────────────────────────────────────────────
  row('Mazorcada Campesina',  30000, 'Maíz tierno, sobrebarriga y pollo mechado, chorizo, chicharrón, salsa de casa, huevos de codorniz, mozarela fundido, lechuga, pico e\'gallo y papas ripio.', img.corn),

  // ── PERROS CALIENTES ────────────────────────────────────────────────────────
  row('El Criollo',           17000, 'Salchicha americana, pan brioche, mozarela fundido, trocitos de piña, salsa de maíz, papa ripio y huevos de codorniz.',                       img.hd1),
  row('El Arriero',           20000, 'Salchicha americana, pan brioche, tocineta, salsa de maíz, cebolla caramelizada, mozarela fundido, huevos de codorniz.',                      img.hd2),
  row('El Gaucho',            15000, 'Chorizo, pan brioche, mozarela fundido y chimichurri.',                                                                                        img.hd1),
  row('El Montañero',         26000, 'Chorizo parrillero, pan brioche tocineta, chimichurri, cebolla caramelizada, mozarela fundido, huevos de codorniz y papa ripio.',             img.hd2),
  row('Campesino Caliente',   30000, 'Salchicha americana, pan brioche, sobrebarriga y pollo mechado, chorizo, chicharrón, salsa de la casa, huevos de codorniz, mozarela fundido y papas ripio.', img.hd1),

  // ── PARRILLA ────────────────────────────────────────────────────────────────
  row('Pechuga Gratinada',    30000, '250gr de pechuga, arepa, papa a la francesa o criolla y limonada natural.',                                                                    img.g3),
  row('Churrasco',            32000, '250gr churrasco, con arepa, papa a la francesa o criolla, chimichurri y limonada natural.',                                                   img.g1),
  row('Costillitas',          30000, '500gr de costillas (miel mostaza o BBQ), papa a la francesa o criolla y limonada natural.',                                                   img.g2),
  row('Alitas',               25000, '8 unidades de alas (miel mostaza o BBQ), papa a la francesa o criolla y limonada natural.',                                                   img.wings),

  // ── PIZZA ───────────────────────────────────────────────────────────────────
  row('Pizza Mediana (28cm)', 23000, 'Mexicana · Pollo con champiñones · Hawaiana · Tocineta maíz · Pepperoni · Napolitana',                                                       img.pizza),

  // ── ADICIONALES ─────────────────────────────────────────────────────────────
  row('Papa Francesa',         7000, null, img.fries),
  row('Papa Criolla',          7000, null, img.sides),
  row('Tocineta',              6000, null, img.sides),
  row('Cebolla Caramelizada',  4000, null, img.sides),
  row('Piña',                  5000, null, img.sides),
  row('Salsa Champiñones',     5000, null, img.sauce),
  row('Salsa Colombiana',      5000, null, img.sauce),
  row('Sour Cream',            5000, null, img.sauce),
  row('Chimichurri',           5000, null, img.sauce),
  row('Hogo',                  5000, null, img.sauce),
  row('Salsa Cheddar',         6000, null, img.sauce),

  // ── BEBIDAS ─────────────────────────────────────────────────────────────────
  row('Jugo Natural en Agua',   8000, null, img.juice),
  row('Jugo Natural en Leche',  9000, null, img.juice),
  row('Limonada Natural',       6000, null, img.juice),
  row('Gaseosas 250ml',         3000, null, img.soda),
  row('CocaCola 350ml',         4500, null, img.soda),
  row('Hit 250ml',              3200, null, img.soda),
  row('Soda Hatsu',             7000, null, img.drinks),
  row('Té Hatsu',               7000, null, img.drinks),
  row('Bretaña',                5000, null, img.soda),
  row('Agua',                   3500, null, img.drinks),
  row('Corona',                 9000, null, img.beer),
  row('Stella',                 9000, null, img.beer),
  row('Tres Cordilleras',       7000, null, img.beer),
  row('Club Colombia',          6000, null, img.beer),
  row('Aguila',                 5000, null, img.beer),
  row('Cola y Pola',            4500, null, img.beer),
  row('Hit 500ml',              5000, null, img.soda),
  row('Coca Cola 400ml',        5000, null, img.soda),
  row('Coca Cola 1.5L',         9000, null, img.soda),

  // ── SODAS ───────────────────────────────────────────────────────────────────
  row('Frutos Rojos',           9000, 'Soda y slash de limón.', img.drinks),
  row('Mandarina y Maracuyá',   9000, 'Soda y slash de limón.', img.drinks),
];

module.exports = {
  up: async (qi) => {
    const [rows] = await qi.sequelize.query(
      `SELECT COUNT(*) AS count FROM recetas WHERE nombre = 'Tradición'`
    );
    const already = parseInt(rows[0].count, 10) > 0;
    if (already) {
      console.log('[seed] Menú ya cargado — omitiendo inserción.');
      return;
    }
    await qi.bulkInsert('recetas', PRODUCTOS);
    console.log(`[seed] ${PRODUCTOS.length} productos del menú insertados.`);
  },

  down: async (qi) => {
    const nombres = PRODUCTOS.map((p) => p.nombre.replace(/'/g, "''"));
    await qi.sequelize.query(
      `DELETE FROM recetas WHERE nombre IN (${nombres.map((n) => `'${n}'`).join(', ')})`
    );
  },
};
