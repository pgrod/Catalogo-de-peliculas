const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    'proyectopeliculas',
    'root',
    process.env.DB_PASSWORD,
    {
        host: 'localhost',
        dialect: 'mysql'
    }
);

module.exports = sequelize;
