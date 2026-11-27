const { DataTypes } = require('sequelize');
const sequelize = require('../conexion/db');

const Carrito = sequelize.define('carrito', {
    idcarrito: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idusuario: {
        type: DataTypes.INTEGER
    },
    idpelicula: {
        type: DataTypes.INTEGER
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2)
    }
}, {
    tableName: 'carrito',
    timestamps: false
});

module.exports = Carrito;
