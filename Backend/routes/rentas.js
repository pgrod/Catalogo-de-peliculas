const express = require('express');
const sequelize = require('../conexion/db');
const { Renta, Carrito, Usuario } = require('../modelos/asociaciones');
const { crearError, entero, manejarError } = require('./helpers');

const router = express.Router();

const ESTADOS = ['Activa', 'Devuelta', 'Vencida', 'Cancelada'];
const DIAS_RENTA_DEFAULT = 3;
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Fecha local en formato YYYY-MM-DD
function formatoFecha(fecha) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// GET /api/rentas/:idusuario
router.get('/:idusuario', async (req, res) => {
    try {
        const idusuario = entero(req.params.idusuario);
        if (!idusuario) return res.status(400).json({ mensaje: 'idusuario invalido' });

        const rentas = await Renta.findAll({
            where: { idusuario },
            order: [['fechaRenta', 'DESC'], ['idrenta', 'DESC']]
        });
        res.status(200).json(rentas);
    } catch (error) {
        manejarError(res, error, 'Error al obtener rentas');
    }
});

// POST /api/rentas  { idusuario, fechaVencimiento? | dias?, total? }
// Si no llega "total", se calcula con la suma del carrito. Al registrar, se vacia el carrito.
router.post('/', async (req, res) => {
    try {
        const idusuario = entero(req.body.idusuario);
        if (!idusuario) return res.status(400).json({ mensaje: 'idusuario invalido' });

        const usuario = await Usuario.findByPk(idusuario);
        if (!usuario) return res.status(404).json({ mensaje: 'El usuario no existe' });

        const hoy = new Date();
        const fechaRenta = formatoFecha(hoy);

        // Fecha de vencimiento: la recibida o hoy + dias (por defecto 3)
        let fechaVencimiento = req.body.fechaVencimiento;
        if (fechaVencimiento !== undefined && fechaVencimiento !== null) {
            if (!FECHA_REGEX.test(fechaVencimiento) || Number.isNaN(Date.parse(fechaVencimiento))) {
                return res.status(400).json({ mensaje: 'fechaVencimiento invalida (formato YYYY-MM-DD)' });
            }
            if (fechaVencimiento < fechaRenta) {
                return res.status(400).json({ mensaje: 'fechaVencimiento no puede ser anterior a la fecha de renta' });
            }
        } else {
            const dias = req.body.dias === undefined ? DIAS_RENTA_DEFAULT : entero(req.body.dias);
            if (!dias) return res.status(400).json({ mensaje: 'dias invalido' });
            const venc = new Date(hoy);
            venc.setDate(venc.getDate() + dias);
            fechaVencimiento = formatoFecha(venc);
        }

        let totalBody = null;
        if (req.body.total !== undefined && req.body.total !== null) {
            totalBody = Number(req.body.total);
            if (Number.isNaN(totalBody) || totalBody < 0) {
                return res.status(400).json({ mensaje: 'total invalido' });
            }
        }

        // Renta + vaciado de carrito de forma atomica
        const renta = await sequelize.transaction(async (t) => {
            const items = await Carrito.findAll({ where: { idusuario }, transaction: t });

            let total = totalBody;
            if (total === null) {
                if (items.length === 0) {
                    throw crearError(400, 'El carrito esta vacio y no se envio un total');
                }
                total = items.reduce((suma, item) => suma + Number(item.precio || 0), 0);
            }

            const nueva = await Renta.create({
                idusuario,
                fechaRenta,
                fechaVencimiento,
                total: Number(total.toFixed(2)),
                estado: 'Activa'
            }, { transaction: t });

            await Carrito.destroy({ where: { idusuario }, transaction: t });
            return nueva;
        });

        res.status(201).json({ mensaje: 'Renta registrada correctamente', renta });
    } catch (error) {
        manejarError(res, error, 'Error al registrar la renta');
    }
});

// PUT /api/rentas/:idrenta  { estado }
router.put('/:idrenta', async (req, res) => {
    try {
        const idrenta = entero(req.params.idrenta);
        if (!idrenta) return res.status(400).json({ mensaje: 'idrenta invalido' });

        const { estado } = req.body;
        if (!estado || !ESTADOS.includes(estado)) {
            return res.status(400).json({
                mensaje: `estado invalido. Valores permitidos: ${ESTADOS.join(', ')}`
            });
        }

        const renta = await Renta.findByPk(idrenta);
        if (!renta) return res.status(404).json({ mensaje: 'Renta no encontrada' });

        renta.estado = estado;
        await renta.save();

        res.status(200).json({ mensaje: 'Renta actualizada correctamente', renta });
    } catch (error) {
        manejarError(res, error, 'Error al actualizar la renta');
    }
});

module.exports = router;
