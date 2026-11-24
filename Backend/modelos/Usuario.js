
const { DataTypes } = require('sequelize');
const sequelize = require('../conexion/db');

const Usuario = sequelize.define('usuario', {
    idusuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING
    },
    correo: {
        type: DataTypes.STRING
    },
    password: {
        type: DataTypes.STRING
    },
    rol: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'usuario',
    timestamps: false
});

module.exports = Usuario;
