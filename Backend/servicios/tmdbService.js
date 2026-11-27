const axios = require('axios');
const Pelicula = require('../modelos/Pelicula');
const { crearError, entero } = require('../routes/helpers');

const TMDB_URL = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';
const IDIOMA_PRINCIPAL = 'es-MX';
const IDIOMA_FALLBACK = 'en-US';

// Precio por defecto: variable de entorno PRECIO_RENTA_DEFAULT o 49.00
function precioPorDefecto() {
    const env = Number(process.env.PRECIO_RENTA_DEFAULT);
    return Number.isFinite(env) && env > 0 ? env : 49.00;
}

// Valida precioRenta recibido del cliente: numero positivo. Si no viene, usa el default.
function validarPrecio(valor) {
    if (valor === undefined || valor === null || valor === '') {
        return precioPorDefecto();
    }
    const precio = Number(valor);
    if (!Number.isFinite(precio) || precio <= 0) {
        throw crearError(400, 'precioRenta invalido (debe ser un numero mayor a 0)');
    }
    return Number(precio.toFixed(2));
}

// Detecta automaticamente el tipo de credencial de TMDB:
// - Read Access Token v4 (JWT, empieza con "eyJ") -> header Authorization: Bearer
// - API Key v3 (32 caracteres hex)                 -> query param api_key
function configurarAutenticacion(apiKey, idioma) {
    const config = { params: { language: idioma }, headers: {}, timeout: 8000 };
    if (apiKey.startsWith('eyJ')) {
        config.headers.Authorization = `Bearer ${apiKey}`;
    } else {
        config.params.api_key = apiKey;
    }
    return config;
}

// Consulta los detalles de una pelicula en TMDB por su id.
async function obtenerDetallesTMDB(idtmdb, idioma = IDIOMA_PRINCIPAL) {
    const apiKey = (process.env.TMDB_API_KEY || '').trim();
    if (!apiKey) {
        throw crearError(500, 'TMDB_API_KEY no esta configurada en el archivo .env');
    }

    try {
        const { data } = await axios.get(
            `${TMDB_URL}/movie/${idtmdb}`,
            configurarAutenticacion(apiKey, idioma)
        );
        return data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            throw crearError(404, `La pelicula con idtmdb ${idtmdb} no existe en TMDB`);
        }
        if (error.response && error.response.status === 401) {
            throw crearError(500, 'TMDB_API_KEY invalida');
        }
        if (error.response && error.response.status === 429) {
            throw crearError(503, 'TMDB limito las peticiones, intenta de nuevo en unos segundos');
        }
        throw crearError(502, 'No se pudo consultar TMDB');
    }
}

// Detalles en es-MX; si overview viene vacio, intenta completarlo en en-US.
async function obtenerDetallesConFallback(idtmdb) {
    const detalles = await obtenerDetallesTMDB(idtmdb, IDIOMA_PRINCIPAL);

    if (!detalles.overview || !detalles.overview.trim()) {
        try {
            const respaldo = await obtenerDetallesTMDB(idtmdb, IDIOMA_FALLBACK);
            if (respaldo.overview) detalles.overview = respaldo.overview;
        } catch (error) {
            // El fallback es opcional: se conserva la descripcion vacia
        }
    }
    return detalles;
}

/**
 * Devuelve la pelicula local (tabla pelicula) correspondiente a un idtmdb.
 * - Si ya existe por idtmdb, la devuelve (sin tocar sus datos).
 * - Si no existe, la registra. Los metadatos (titulo, descripcion, genero, anio, imagen)
 *   se toman EXCLUSIVAMENTE de TMDB. Del cliente solo se acepta precioRenta.
 *   Asi se evitan errores de FOREIGN KEY en favorito/carrito y no se
 *   contamina la tabla compartida.
 *
 * @param {object} datos { idtmdb, precioRenta? }
 * @returns {Promise<Pelicula>}
 */
async function obtenerOCrearPelicula(datos = {}) {
    const idtmdb = entero(datos.idtmdb);
    if (!idtmdb) {
        throw crearError(400, 'idtmdb invalido');
    }
    const precioRenta = validarPrecio(datos.precioRenta);

    const existente = await Pelicula.findOne({ where: { idtmdb } });
    if (existente) return existente;

    const tmdb = await obtenerDetallesConFallback(idtmdb);

    if (!tmdb.title || !tmdb.title.trim()) {
        throw crearError(502, 'TMDB no devolvio un titulo para esta pelicula');
    }

    const nueva = {
        idtmdb,
        titulo: tmdb.title,
        descripcion: tmdb.overview || null,
        genero: tmdb.genres && tmdb.genres[0] ? tmdb.genres[0].name : null,
        anio: tmdb.release_date ? parseInt(tmdb.release_date.slice(0, 4), 10) || null : null,
        imagen: tmdb.poster_path ? `${TMDB_IMG}${tmdb.poster_path}` : null,
        precioRenta,
        disponible: true
    };

    try {
        return await Pelicula.create(nueva);
    } catch (error) {
        // Otro request la inserto al mismo tiempo (idtmdb UNIQUE)
        if (error.name === 'SequelizeUniqueConstraintError') {
            const creada = await Pelicula.findOne({ where: { idtmdb } });
            if (creada) return creada;
        }
        throw error;
    }
}

/**
 * Resuelve la pelicula local a partir del body de una peticion:
 * - { idpelicula }: pelicula que ya existe localmente.
 * - { idtmdb, precioRenta? }: se busca o registra desde TMDB.
 * Si vienen ambos, tiene prioridad idpelicula (idtmdb se ignora).
 */
async function resolverPelicula(body = {}) {
    if (body.idpelicula !== undefined && body.idpelicula !== null) {
        const idpelicula = entero(body.idpelicula);
        if (!idpelicula) throw crearError(400, 'idpelicula invalido');

        const pelicula = await Pelicula.findByPk(idpelicula);
        if (!pelicula) throw crearError(404, 'La pelicula no existe');
        return pelicula;
    }
    if (body.idtmdb === undefined || body.idtmdb === null) {
        throw crearError(400, 'Se requiere idpelicula o idtmdb');
    }
    return obtenerOCrearPelicula(body);
}

module.exports = { obtenerDetallesTMDB, obtenerOCrearPelicula, resolverPelicula };
