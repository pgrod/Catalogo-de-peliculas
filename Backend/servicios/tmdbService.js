require('dotenv').config();
const axios = require('axios');
const Pelicula = require('../modelos/Pelicula');

const TMDB_URL = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';
const PRECIO_RENTA_DEFAULT = 49.00;

function crearError(status, mensaje) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

// Consulta los detalles de una pelicula en TMDB por su id.
async function obtenerDetallesTMDB(idtmdb) {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
        throw crearError(500, 'TMDB_API_KEY no esta configurada en el archivo .env');
    }

    try {
        const { data } = await axios.get(`${TMDB_URL}/movie/${idtmdb}`, {
            params: { api_key: apiKey, language: 'es-MX' },
            timeout: 8000
        });
        return data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            throw crearError(404, `La pelicula con idtmdb ${idtmdb} no existe en TMDB`);
        }
        if (error.response && error.response.status === 401) {
            throw crearError(500, 'TMDB_API_KEY invalida');
        }
        throw crearError(502, 'No se pudo consultar TMDB');
    }
}

/**
 * Devuelve la pelicula local (tabla pelicula) correspondiente a un idtmdb.
 * - Si ya existe por idtmdb, la devuelve.
 * - Si no existe, la registra usando los datos recibidos y, para lo que falte,
 *   los obtiene de TMDB. Asi se evitan errores de FOREIGN KEY en favorito/carrito.
 *
 * @param {object} datos { idtmdb, titulo?, descripcion?, genero?, anio?, imagen?, precioRenta? }
 * @returns {Promise<Pelicula>}
 */
async function obtenerOCrearPelicula(datos = {}) {
    const idtmdb = parseInt(datos.idtmdb, 10);
    if (!Number.isInteger(idtmdb) || idtmdb <= 0) {
        throw crearError(400, 'idtmdb invalido');
    }

    const existente = await Pelicula.findOne({ where: { idtmdb } });
    if (existente) return existente;

    const nueva = {
        idtmdb,
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        genero: datos.genero,
        anio: datos.anio,
        imagen: datos.imagen,
        precioRenta: datos.precioRenta,
        disponible: true
    };

    // Completar con TMDB si faltan datos esenciales
    if (!nueva.titulo || !nueva.descripcion || !nueva.imagen || !nueva.genero || !nueva.anio) {
        const tmdb = await obtenerDetallesTMDB(idtmdb);
        nueva.titulo = nueva.titulo || tmdb.title;
        nueva.descripcion = nueva.descripcion || tmdb.overview;
        nueva.genero = nueva.genero || (tmdb.genres && tmdb.genres[0] ? tmdb.genres[0].name : null);
        nueva.anio = nueva.anio || (tmdb.release_date ? parseInt(tmdb.release_date.slice(0, 4), 10) : null);
        nueva.imagen = nueva.imagen || (tmdb.poster_path ? `${TMDB_IMG}${tmdb.poster_path}` : null);
    }

    if (nueva.precioRenta === undefined || nueva.precioRenta === null || nueva.precioRenta === '') {
        nueva.precioRenta = PRECIO_RENTA_DEFAULT;
    }

    try {
        return await Pelicula.create(nueva);
    } catch (error) {
        // Otro request la inserto al mismo tiempo (idtmdb UNIQUE)
        if (error.name === 'SequelizeUniqueConstraintError') {
            return await Pelicula.findOne({ where: { idtmdb } });
        }
        throw error;
    }
}

/**
 * Resuelve la pelicula local a partir del body de una peticion:
 * acepta { idpelicula } (ya existe localmente) o { idtmdb, ...datos }.
 */
async function resolverPelicula(body = {}) {
    if (body.idpelicula !== undefined && body.idpelicula !== null) {
        const pelicula = await Pelicula.findByPk(body.idpelicula);
        if (!pelicula) throw crearError(404, 'La pelicula no existe');
        return pelicula;
    }
    if (body.idtmdb === undefined || body.idtmdb === null) {
        throw crearError(400, 'Se requiere idpelicula o idtmdb');
    }
    return obtenerOCrearPelicula(body);
}

module.exports = { obtenerDetallesTMDB, obtenerOCrearPelicula, resolverPelicula, crearError };
