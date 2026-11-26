require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const sequelize = require('./conexion/db');
const Usuario = require('./modelos/Usuario');
require('./modelos/asociaciones');

const app = express();

app.use(cors());
app.use(express.json());

// Favorito, Carrito y Renta
app.use('/api/favoritos', require('./routes/favoritos'));
app.use('/api/carrito', require('./routes/carrito'));
app.use('/api/rentas', require('./routes/rentas'));

app.get('/usuarios', async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            attributes: ['idusuario', 'nombre', 'correo', 'rol']
        });

        res.json(usuarios);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            mensaje: 'Error al obtener usuarios'
        });
    }
});

app.get('/', (req, res) => {
    res.send('API de peliculas funcionando');
});

app.post('/usuarios', async (req, res) => {
    try {
        const { nombre, correo, password, rol } = req.body;

        const usuario = await Usuario.create({
            nombre,
            correo,
            password,
            rol
        });

        res.json({
            mensaje: 'Usuario agregado correctamente',
            idusuario: usuario.idusuario
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            mensaje: 'Error al agregar usuario'
        });
    }
});

sequelize.authenticate()
    .then(() => {
        console.log('Conexion a MySQL exitosa');
    })
    .catch((error) => {
        console.log('Error de conexion:', error);
    });

app.listen(3001, () => {
    console.log('Servidor en puerto 3001');
});
