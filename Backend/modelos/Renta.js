const { DataTypes } = require('sequelize');
const sequelize = require('../conexion/db');

const Renta = sequelize.define('renta', {
    idrenta: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idusuario: {
        type: DataTypes.INTEGER
    },
    fechaRenta: {
        type: DataTypes.DATEONLY
    },
    fechaVencimiento: {
        type: DataTypes.DATEONLY
    },
    total: {
        type: DataTypes.DECIMAL(10, 2)
    },
    estado: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'renta',
    timestamps: false
});

module.exports = Renta;
