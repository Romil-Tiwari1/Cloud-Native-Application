require('dotenv').config({ path: '/etc/webapp.env', override: true });
const logToApplication = require('../logger/log');
const { Sequelize } = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const dbConfig = require('../config/config');

logToApplication(`Connected to ${dbConfig[env].database} database in ${env} mode.`);

const sequelize = new Sequelize({
  dialect: dbConfig[env].dialect,
  host: dbConfig[env].host,
  database: dbConfig[env].database,
  username: dbConfig[env].username,
  password: dbConfig[env].password
});

//Import Models
const UserModel = require('../models/user')(sequelize);
const AssignmentModel = require('../models/assignment')(sequelize);

const createDatabase = async () => {
  try {
    const sequelizeTemp = new Sequelize({
      dialect: dbConfig[env].dialect,
      host: dbConfig[env].host,
      username: dbConfig[env].username,
      password: dbConfig[env].password,
      logging: (msg) => logToApplication(msg)
    });

    const query = `CREATE DATABASE IF NOT EXISTS ${dbConfig[env].database};`;
    await sequelizeTemp.query(query);
    logToApplication(`Database "${dbConfig[env].database}" ensured.`);
    await sequelizeTemp.close();
  } catch (err) {
    logToApplication(`Failed to ensure database: ${err.message}`);
  }
};

const initializeModels = async () => {
  try {
    await sequelize.sync({ alter: true });
    logToApplication('Models synchronized with database.');
  } catch (err) {
    logToApplication(`Failed to synchronize models: ${err.message}`);
  }
};

// Initialize everything in sequence only when this function is called
const initializeDatabase = async () => {
  await createDatabase();
  await initializeModels();
};

module.exports = {
  sequelize,
  initializeDatabase
};
