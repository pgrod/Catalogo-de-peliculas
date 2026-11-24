
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    'proyectopeliculas',
    'root',
    'Coquien12!',
    {
        host: 'localhost',
        dialect: 'mysql'
    }
);

module.exports = sequelize;
