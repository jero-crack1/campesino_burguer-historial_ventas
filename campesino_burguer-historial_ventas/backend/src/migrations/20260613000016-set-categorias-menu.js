const CATEGORIAS = [
  { categoria: 'Entradas', nombres: ['Rellena Campesina','Longaniza Campesina','Patacones Criollos','Chorizo con Arepa','Choricriolla','Arepas Campesinas','Dorilocos','Aros de Cebolla'] },
  { categoria: 'Burgers', nombres: ["Tradición","Doble Tradición","Fusión Campesina","Chicken's Campirana","Arrebatada","Mastersina","Colombiana","Campesino Burger","Bacon del Campo"] },
  { categoria: 'Patacón', nombres: ['Patacón Arriero'] },
  { categoria: 'Salchipapas', nombres: ['Salchipapa Tradición','Salchipapa del Campo'] },
  { categoria: 'Mazorcada', nombres: ['Mazorcada Campesina'] },
  { categoria: 'Perros Calientes', nombres: ['El Criollo','El Arriero','El Gaucho','El Montañero','Campesino Caliente'] },
  { categoria: 'Parrilla', nombres: ['Pechuga Gratinada','Churrasco','Costillitas','Alitas'] },
  { categoria: 'Pizza', nombres: ['Pizza Mediana (28cm)'] },
  { categoria: 'Adicionales', nombres: ['Papa Francesa','Papa Criolla','Tocineta','Cebolla Caramelizada','Piña','Salsa Champiñones','Salsa Colombiana','Sour Cream','Chimichurri','Hogo','Salsa Cheddar'] },
  { categoria: 'Bebidas', nombres: ['Jugo Natural en Agua','Jugo Natural en Leche','Limonada Natural','Gaseosas 250ml','CocaCola 350ml','Hit 250ml','Soda Hatsu','Té Hatsu','Bretaña','Agua','Corona','Stella','Tres Cordilleras','Club Colombia','Aguila','Cola y Pola','Hit 500ml','Coca Cola 400ml','Coca Cola 1.5L'] },
  { categoria: 'Sodas', nombres: ['Frutos Rojos','Mandarina y Maracuyá'] },
];

module.exports = {
  up: async (qi) => {
    for (const { categoria, nombres } of CATEGORIAS) {
      const escaped = nombres.map((n) => `'${n.replace(/'/g, "''")}'`).join(', ');
      await qi.sequelize.query(
        `UPDATE recetas SET categoria = '${categoria}' WHERE nombre IN (${escaped})`
      );
    }
  },
  down: async (qi) => {
    await qi.sequelize.query(`UPDATE recetas SET categoria = NULL`);
  },
};
