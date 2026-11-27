// Relaciones entre modelos (llaves foraneas de "tablas sql").
// Se cargan una sola vez desde index.js.
const Usuario = require('./Usuario');
const Pelicula = require('./Pelicula');
const Favorito = require('./Favorito');
const Carrito = require('./Carrito');
const Renta = require('./Renta');

// favorito
Usuario.hasMany(Favorito, { foreignKey: 'idusuario' });
Favorito.belongsTo(Usuario, { foreignKey: 'idusuario' });
Pelicula.hasMany(Favorito, { foreignKey: 'idpelicula' });
Favorito.belongsTo(Pelicula, { foreignKey: 'idpelicula' });

// carrito
Usuario.hasMany(Carrito, { foreignKey: 'idusuario' });
Carrito.belongsTo(Usuario, { foreignKey: 'idusuario' });
Pelicula.hasMany(Carrito, { foreignKey: 'idpelicula' });
Carrito.belongsTo(Pelicula, { foreignKey: 'idpelicula' });

// renta
Usuario.hasMany(Renta, { foreignKey: 'idusuario' });
Renta.belongsTo(Usuario, { foreignKey: 'idusuario' });

module.exports = { Usuario, Pelicula, Favorito, Carrito, Renta };
