require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const sequelize = require('./conexion/db');
const Usuario = require('./modelos/Usuario');
const Resena = require('./modelos/Resena');
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

app.put('/usuarios/:id', async (req, res) => {
    try {
        const { nombre, correo } = req.body;

        const resultado = await Usuario.update({
            nombre,
            correo
        }, {
            where: {
                idusuario: req.params.id
            }
        });

        if (resultado[0] === 0) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado o sin cambios'
            });
        }

        res.json({
            mensaje: 'Usuario actualizado correctamente'
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            mensaje: 'Error al actualizar usuario'
        });
    }
});

app.delete('/usuarios/:id', async (req, res) => {
    try {
        const resultado = await Usuario.destroy({
            where: {
                idusuario: req.params.id
            }
        });

        if (resultado === 0) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        res.json({
            mensaje: 'Usuario eliminado correctamente'
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            mensaje: 'Error al eliminar usuario'
        });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { correo, password } = req.body;

        const usuario = await Usuario.findOne({
            where: {
                correo: correo,
                password: password
            },
            attributes: ['idusuario', 'nombre', 'correo', 'rol']
        });

        if (!usuario) {
            return res.status(401).json({
                mensaje: 'Correo o contraseña incorrectos'
            });
        }

        res.json({
            mensaje: 'Inicio de sesion correcto',
            usuario: usuario
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            mensaje: 'Error al iniciar sesion'
        });
    }
});

app.get('/peliculas', async (req, res) => {
    try {
        const respuesta = await fetch(
            'https://api.themoviedb.org/3/movie/popular?language=es-ES&page=1',
            {
                headers: {
                    Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
                    accept: 'application/json'
                }
            }
        );

        if (!respuesta.ok) {
            return res.status(respuesta.status).json({
                mensaje: 'Error en la API de TMDb'
            });
        }

        const datos = await respuesta.json();

        res.json(datos.results);

    } catch (error) {
        console.log(error);
        res.status(500).json({
            mensaje: 'Error al obtener peliculas'
        });
    }
});

app.get('/resenas/:idpelicula', async (req, res) => {
    try {
        const resenas = await Resena.findAll({
            where: {
                idpelicula: req.params.idpelicula
            }
        });

        res.json(resenas);

    } catch (error) {
        console.log(error);
        res.status(500).json({
            mensaje: 'Error al obtener resenas'
        });
    }
});

app.post('/resenas', async (req, res) => {
    try {
        const { idusuario, idpelicula, comentario,
            calificacion, fecha } = req.body;

        if (!Number.isInteger(calificacion) ||
            calificacion < 1 || calificacion > 5) {
            return res.status(400).json({
                mensaje: 'La calificacion debe ser entre 1 y 5'
            });
        }

        await Resena.create({idusuario, idpelicula, comentario, calificacion, fecha
        });

        res.json({
            mensaje: 'Resena agregada correctamente'
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            mensaje: 'Error al agregar resena'
        });
    }
});

app.put('/resenas/:id', async (req, res) => {
    try {
        const { comentario, calificacion } = req.body;

        if (!Number.isInteger(calificacion) ||
            calificacion < 1 || calificacion > 5) {
            return res.status(400).json({
                mensaje: 'La calificacion debe ser entre 1 y 5'
            });
        }

        const resultado = await Resena.update({
            comentario,
            calificacion
        }, {
            where: {
                idresena: req.params.id
            }
        });

        if (resultado[0] === 0) {
            return res.status(404).json({
                mensaje: 'Resena no encontrada o sin cambios'
            });
        }

        res.json({
            mensaje: 'Resena actualizada correctamente'
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            mensaje: 'Error al actualizar resena'
        });
    }
});

app.delete('/resenas/:id', async (req, res) => {
    try {
        const resultado = await Resena.destroy({
            where: {
                idresena: req.params.id
            }
        });

        if (resultado === 0) {
            return res.status(404).json({
                mensaje: 'Resena no encontrada'
            });
        }

        res.json({
            mensaje: 'Resena eliminada correctamente'
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            mensaje: 'Error al eliminar resena'
        });
    }
});

app.get('/resenas/promedio/:idpelicula', async (req, res) => {
    try {
        const resultado = await Resena.findAll({
            attributes: [
                [sequelize.fn('AVG',
                    sequelize.col('calificacion')), 'promedio'],
                [sequelize.fn('COUNT',
                    sequelize.literal('*')), 'total_resenas']
            ],
            where: {
                idpelicula: req.params.idpelicula
            }
        });

        res.json(resultado);

    } catch (error) {
        console.log(error);
        res.status(500).json({
            mensaje: 'Error al calcular promedio'
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
