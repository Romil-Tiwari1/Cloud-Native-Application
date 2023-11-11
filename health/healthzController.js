const { Sequelize } = require('sequelize');
const dbConfig = require('../config/config');
const env = process.env.NODE_ENV || 'development';
const dbConfigToUse = dbConfig[env];

//Sequelize Initialization
const sequelize = new Sequelize({
  dialect: dbConfigToUse.dialect,
  host: dbConfigToUse.host,
  database: dbConfigToUse.database,
  username: dbConfigToUse.username,
  password: dbConfigToUse.password
});

exports.checkNoPayload = (req, res, next) => {
  if (Object.keys(req.body).length !== 0) {
    res.status(400).set({
      'Cache-Control': 'no-cache, no-store, must-revalidate;',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    }).json({ message: 'Payload Not allowed' });
    return;
  }
  next();
};

//Method Validation
exports.checkMethod = (req, res, next) => {
  if (req.method !== 'GET') {
    res.status(405).set({
      'Cache-Control': 'no-cache, no-store, must-revalidate;',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    }).json({ message: 'Method not allowed' });
    return;
  }
  next();
};

//Database Connection Check
exports.checkDatabase = (req, res) => {
  sequelize.authenticate()
    .then(() => {
      res.status(200).set({
        'Cache-Control': 'no-cache, no-store, must-revalidate;',
        'Pragma': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      }).json({ message: 'Database Connection Status : Successful' });
    })
    .catch(() => {
      res.status(503).set({
        'Cache-Control': 'no-cache, no-store, must-revalidate;',
        'Pragma': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      }).json({ error: 'Database Connection Status : Unsuccessful' });
    });
};
