const { DataTypes } = require('sequelize');
const sequelize = require('../conexion/db');

const Favorito = sequelize.define('favorito', {
    idfavorito: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idusuario: {
        type: DataTypes.INTEGER
    },
    idpelicula: {
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'favorito',
    timestamps: false
});

module.exports = Favorito;
