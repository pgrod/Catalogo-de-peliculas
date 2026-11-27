const { DataTypes } = require('sequelize');
const sequelize = require('../conexion/db');

// Modelo de apoyo: el CRUD de pelicula lo implementa otro integrante del equipo.
const Pelicula = sequelize.define('pelicula', {
    idpelicula: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idtmdb: {
        type: DataTypes.INTEGER,
        unique: true
    },
    titulo: {
        type: DataTypes.STRING
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    genero: {
        type: DataTypes.STRING
    },
    anio: {
        type: DataTypes.INTEGER
    },
    imagen: {
        type: DataTypes.TEXT
    },
    precioRenta: {
        type: DataTypes.DECIMAL(10, 2)
    },
    disponible: {
        type: DataTypes.BOOLEAN
    }
}, {
    tableName: 'pelicula',
    timestamps: false
});

module.exports = Pelicula;
