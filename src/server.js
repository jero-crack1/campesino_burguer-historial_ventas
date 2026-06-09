const app = require('./app');
const sequelize = require('./config/database');

const PORT = process.env.PORT || 3000;

async function start() {
  await sequelize.authenticate();

  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Unable to start API:', error.message);
  process.exit(1);
});
