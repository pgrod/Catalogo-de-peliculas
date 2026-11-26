const express = require('express');
const { Carrito, Pelicula, Usuario } = require('../modelos/asociaciones');
const { resolverPelicula } = require('../servicios/tmdbService');
const { entero, manejarError } = require('./helpers');

const router = express.Router();

// GET /api/carrito/:idusuario
router.get('/:idusuario', async (req, res) => {
    try {
        const idusuario = entero(req.params.idusuario);
        if (!idusuario) return res.status(400).json({ mensaje: 'idusuario invalido' });

        const items = await Carrito.findAll({
            where: { idusuario },
            include: [{ model: Pelicula }]
        });
        const total = items.reduce((suma, item) => suma + Number(item.precio || 0), 0);

        res.status(200).json({ total: Number(total.toFixed(2)), items });
    } catch (error) {
        manejarError(res, error, 'Error al obtener el carrito');
    }
});

// POST /api/carrito  { idusuario, idtmdb | idpelicula, precio?, ...datos opcionales de la pelicula }
router.post('/', async (req, res) => {
    try {
        const idusuario = entero(req.body.idusuario);
        if (!idusuario) return res.status(400).json({ mensaje: 'idusuario invalido' });

        const usuario = await Usuario.findByPk(idusuario);
        if (!usuario) return res.status(404).json({ mensaje: 'El usuario no existe' });

        const pelicula = await resolverPelicula(req.body);

        if (pelicula.disponible === false) {
            return res.status(400).json({ mensaje: 'La pelicula no esta disponible para renta' });
        }

        const repetido = await Carrito.findOne({
            where: { idusuario, idpelicula: pelicula.idpelicula }
        });
        if (repetido) {
            return res.status(409).json({ mensaje: 'La pelicula ya esta en el carrito' });
        }

        let precio = pelicula.precioRenta;
        if (req.body.precio !== undefined && req.body.precio !== null) {
            precio = Number(req.body.precio);
            if (Number.isNaN(precio) || precio < 0) {
                return res.status(400).json({ mensaje: 'precio invalido' });
            }
        }

        const item = await Carrito.create({
            idusuario,
            idpelicula: pelicula.idpelicula,
            precio
        });
        res.status(201).json({
            mensaje: 'Pelicula agregada al carrito',
            idcarrito: item.idcarrito,
            pelicula
        });
    } catch (error) {
        manejarError(res, error, 'Error al agregar al carrito');
    }
});

// DELETE /api/carrito/vaciar/:idusuario
router.delete('/vaciar/:idusuario', async (req, res) => {
    try {
        const idusuario = entero(req.params.idusuario);
        if (!idusuario) return res.status(400).json({ mensaje: 'idusuario invalido' });

        const eliminados = await Carrito.destroy({ where: { idusuario } });
        res.status(200).json({ mensaje: 'Carrito vaciado correctamente', eliminados });
    } catch (error) {
        manejarError(res, error, 'Error al vaciar el carrito');
    }
});

// DELETE /api/carrito/:idcarrito
router.delete('/:idcarrito', async (req, res) => {
    try {
        const idcarrito = entero(req.params.idcarrito);
        if (!idcarrito) return res.status(400).json({ mensaje: 'idcarrito invalido' });

        const eliminados = await Carrito.destroy({ where: { idcarrito } });
        if (!eliminados) return res.status(404).json({ mensaje: 'Item del carrito no encontrado' });

        res.status(200).json({ mensaje: 'Item eliminado del carrito' });
    } catch (error) {
        manejarError(res, error, 'Error al eliminar item del carrito');
    }
});

module.exports = router;
