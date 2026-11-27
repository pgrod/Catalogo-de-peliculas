const express = require('express');
const { Favorito, Pelicula, Usuario } = require('../modelos/asociaciones');
const { resolverPelicula } = require('../servicios/tmdbService');
const { entero, manejarError } = require('./helpers');

const router = express.Router();

// GET /api/favoritos/:idusuario
router.get('/:idusuario', async (req, res) => {
    try {
        const idusuario = entero(req.params.idusuario);
        if (!idusuario) return res.status(400).json({ mensaje: 'idusuario invalido' });

        const favoritos = await Favorito.findAll({
            where: { idusuario },
            include: [{ model: Pelicula }]
        });
        res.status(200).json(favoritos);
    } catch (error) {
        manejarError(res, error, 'Error al obtener favoritos');
    }
});

// POST /api/favoritos  { idusuario, idtmdb | idpelicula, ...datos opcionales de la pelicula }
router.post('/', async (req, res) => {
    try {
        const idusuario = entero(req.body.idusuario);
        if (!idusuario) return res.status(400).json({ mensaje: 'idusuario invalido' });

        const usuario = await Usuario.findByPk(idusuario);
        if (!usuario) return res.status(404).json({ mensaje: 'El usuario no existe' });

        const pelicula = await resolverPelicula(req.body);

        const existente = await Favorito.findOne({
            where: { idusuario, idpelicula: pelicula.idpelicula }
        });
        if (existente) {
            return res.status(409).json({ mensaje: 'La pelicula ya esta en favoritos' });
        }

        const favorito = await Favorito.create({ idusuario, idpelicula: pelicula.idpelicula });
        res.status(201).json({
            mensaje: 'Pelicula agregada a favoritos',
            idfavorito: favorito.idfavorito,
            pelicula
        });
    } catch (error) {
        manejarError(res, error, 'Error al agregar favorito');
    }
});

// DELETE /api/favoritos/:idfavorito
router.delete('/:idfavorito', async (req, res) => {
    try {
        const idfavorito = entero(req.params.idfavorito);
        if (!idfavorito) return res.status(400).json({ mensaje: 'idfavorito invalido' });

        const eliminados = await Favorito.destroy({ where: { idfavorito } });
        if (!eliminados) return res.status(404).json({ mensaje: 'Favorito no encontrado' });

        res.status(200).json({ mensaje: 'Favorito eliminado correctamente' });
    } catch (error) {
        manejarError(res, error, 'Error al eliminar favorito');
    }
});

module.exports = router;
