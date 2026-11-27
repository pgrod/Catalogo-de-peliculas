// Utilidades compartidas por las rutas.

// Crea un Error con codigo HTTP (lo interpreta manejarError).
function crearError(status, mensaje) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

// Convierte a entero positivo; devuelve null si no es valido.
function entero(valor) {
    const n = Number(valor);
    return Number.isInteger(n) && n > 0 ? n : null;
}

// Responde segun el tipo de error (HTTP claro).
function manejarError(res, error, mensajeDefault) {
    if (error.status) {
        return res.status(error.status).json({ mensaje: error.message });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ mensaje: 'El registro ya existe' });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ mensaje: 'Referencia invalida (usuario o pelicula inexistente)' });
    }
    console.log(error);
    return res.status(500).json({ mensaje: mensajeDefault });
}

module.exports = { crearError, entero, manejarError };
