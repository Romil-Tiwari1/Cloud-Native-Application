require('dotenv').config({ path: '/etc/webapp.env' });
module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'Boston',
    database: process.env.DB_NAME || 'csye6225',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql'
  },
    test: {
      username: 'testuser',
      password: 'root',
      database: 'projectDb_test',
      host: 'localhost',
      dialect: 'mysql'
    }
  };