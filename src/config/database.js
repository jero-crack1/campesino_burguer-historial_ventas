const path = require('path');
const { Sequelize } = require('sequelize');

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      logging: false
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '..', '..', 'data.sqlite'),
      logging: false
    });

module.exports = sequelize;
