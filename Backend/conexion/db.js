
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    'proyectopeliculas',
    'root',
    'admin',
    {
        host: 'localhost',
        dialect: 'mysql'
    }
);

module.exports = sequelize;
