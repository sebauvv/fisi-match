/**
 * Cliente HTTP para la API de Cybertesis UNMSM (DSpace 7).
 * Maneja paginación, rate-limiting y reintentos con backoff exponencial.
 */

const axios = require('axios');
const config = require('./config');

const client = axios.create({
	timeout: config.scraping.requestTimeout,
	headers: {
		'Accept': 'application/json',
		'User-Agent': 'CybertesisScraper/1.0 (UNMSM Software Inteligente)',
	},
});

/**
 * Espera un número de milisegundos.
 */
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Realiza un GET con reintentos y backoff exponencial.
 * @param {string} url
 * @returns {Promise<object>} JSON response data
 */
async function fetchWithRetry(url) {
	let lastError;

	for (let attempt = 1; attempt <= config.scraping.maxRetries; attempt++) {
		try {
			const response = await client.get(url);
			return response.data;
		} catch (error) {
			lastError = error;
			const status = error.response?.status;
			const msg = error.message;

			// No reintentar en errores 4xx (excepto 429 Too Many Requests)
			if (status && status >= 400 && status < 500 && status !== 429) {
				throw new Error(`HTTP ${status} para ${url}: ${msg}`);
			}

			if (attempt < config.scraping.maxRetries) {
				const delay = config.scraping.retryBackoff * Math.pow(2, attempt - 1);
				console.warn(
					`  ⚠ Intento ${attempt}/${config.scraping.maxRetries} falló (${msg}). Reintentando en ${delay}ms...`
				);
				await sleep(delay);
			}
		}
	}

	throw new Error(
		`Falló después de ${config.scraping.maxRetries} intentos: ${lastError.message}`
	);
}

/**
 * Obtiene la lista completa de asesores del browse endpoint.
 * @returns {Promise<Array>} Array de advisor entries
 */
async function fetchAdvisorList() {
	const { baseUrl, advisorEntriesPath, scopeId, advisorPageSize } = config.api;
	const url = `${baseUrl}${advisorEntriesPath}?scope=${scopeId}&page=0&size=${advisorPageSize}&sort=default,ASC`;

	console.log('- Obteniendo lista de asesores...');
	const data = await fetchWithRetry(url);

	const entries = data?._embedded?.entries || [];
	const totalElements = data?.page?.totalElements || entries.length;

	console.log(`   Encontrados: ${totalElements} asesores\n`);
	return entries;
}

/**
 * Obtiene todas las tesis de un asesor, manejando paginación.
 * @param {string} href - URL del endpoint de items del asesor
 * @returns {Promise<Array>} Array de thesis items
 */
async function fetchAdvisorTheses(href) {
	const allItems = [];
	let page = 0;
	let totalPages = 1;

	// Agregar size al href si no lo tiene
	const separator = href.includes('?') ? '&' : '?';
	const baseHref = `${href}${separator}size=${config.api.thesesPageSize}`;

	while (page < totalPages) {
		const url = `${baseHref}&page=${page}`;
		await sleep(config.scraping.requestDelay);

		const data = await fetchWithRetry(url);
		const items = data?._embedded?.items || [];
		allItems.push(...items);

		totalPages = data?.page?.totalPages || 1;
		page++;
	}

	return allItems;
}

module.exports = {
	fetchAdvisorList,
	fetchAdvisorTheses,
};
