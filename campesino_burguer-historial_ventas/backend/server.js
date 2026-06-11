require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('✓ PostgreSQL (Neon) conectado');
    app.listen(PORT, () => console.log(`✓ Servidor corriendo en puerto ${PORT}`));
  } catch (err) {
    console.error('✗ Error al iniciar:', err.message);
    process.exit(1);
  }
}

start();
