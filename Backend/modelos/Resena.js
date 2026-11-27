const { DataTypes } = require('sequelize');
const sequelize = require('../conexion/db');

const Resena = sequelize.define('Resena', {
    idreseña: {
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
    comentario: {
        type: DataTypes.TEXT
    },
    calificacion: {
        type: DataTypes.INTEGER
    },
    fecha: {
        type: DataTypes.DATEONLY
    }
}, {
    tableName: 'resenas',
    timestamps: false
});

module.exports = Resena;