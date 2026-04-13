/**
 * Cliente para la API pública de ORCID v3.0.
 * Obtiene publicaciones externas (papers, artículos, conferencias) de asesores con ORCID.
 */

const axios = require('axios');
const config = require('./config');

const orcidClient = axios.create({
	timeout: config.scraping.requestTimeout,
	headers: {
		Accept: 'application/json',
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
 * Extrae el ID de ORCID de una URL.
 * Ej: "https://orcid.org/0000-0002-1177-4947" → "0000-0002-1177-4947"
 * @param {string} orcidUrl
 * @returns {string|null}
 */
function extractOrcidId(orcidUrl) {
	if (!orcidUrl) return null;
	const match = orcidUrl.match(/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/);
	return match ? match[1] : null;
}

/**
 * Obtiene las publicaciones de un ORCID ID desde la API pública.
 * @param {string} orcidId - Ej: "0000-0002-1177-4947"
 * @returns {Promise<object[]>} Array de work summaries
 */
async function fetchOrcidWorks(orcidId) {
	const url = `${config.orcid.baseUrl}/${orcidId}/works`;

	try {
		const response = await orcidClient.get(url);
		const groups = response.data?.group || [];

		return groups.map((group) => {
			const summary = group['work-summary']?.[0];
			if (!summary) return null;

			// Extraer DOI si existe
			const externalIds = summary['external-ids']?.['external-id'] || [];
			const doiEntry = externalIds.find((e) => e['external-id-type'] === 'doi');
			const doi = doiEntry?.['external-id-value'] || null;

			// Extraer URL
			const externalUrl = summary.url?.value || (doi ? `https://doi.org/${doi}` : '');

			// Extraer año
			const pubYear = summary['publication-date']?.year?.value || null;

			return {
				title: summary.title?.title?.value || '',
				type: summary.type || '',
				year: pubYear ? parseInt(pubYear, 10) : null,
				journal: summary['journal-title']?.value || '',
				doi: doi || '',
				external_url: externalUrl,
			};
		}).filter(Boolean);
	} catch (error) {
		const status = error.response?.status;
		if (status === 404) {
			return []; // ORCID no encontrado o sin works
		}
		console.warn(`  ⚠ Error ORCID ${orcidId}: ${error.message}`);
		return [];
	}
}

/**
 * Enriquece una lista de asesores con publicaciones externas de ORCID.
 * @param {object[]} advisors - Perfiles de asesores con campo orcid
 * @returns {Promise<{ publications: object[], orcidReport: object[] }>}
 */
async function enrichWithOrcid(advisors) {
	const advisorsWithOrcid = advisors.filter((a) => a.orcid);

	if (advisorsWithOrcid.length === 0) {
		console.log('ℹ  Ningún asesor tiene ORCID registrado.');
		return { publications: [], orcidReport: [] };
	}

	console.log(`\n> Buscando publicaciones externas vía ORCID (${advisorsWithOrcid.length} asesores)...\n`);

	const allPublications = [];
	const orcidReport = [];

	for (let i = 0; i < advisorsWithOrcid.length; i++) {
		const advisor = advisorsWithOrcid[i];
		const orcidId = extractOrcidId(advisor.orcid);

		if (!orcidId) {
			console.warn(`  ⚠ ORCID inválido para ${advisor.full_name}: ${advisor.orcid}`);
			continue;
		}

		const progress = `[${i + 1}/${advisorsWithOrcid.length}]`;
		console.log(`${progress} -> ORCID ${orcidId}: ${advisor.full_name}...`);

		await sleep(config.orcid.requestDelay);
		const works = await fetchOrcidWorks(orcidId);

		if (works.length > 0) {
			// Agregar metadata del asesor a cada publicación
			for (const work of works) {
				allPublications.push({
					advisor_id: advisor.id,
					advisor_name: advisor.full_name,
					orcid: advisor.orcid,
					...work,
				});
			}

			orcidReport.push({
				name: advisor.full_name,
				orcid: advisor.orcid,
				orcid_id: orcidId,
				works_count: works.length,
			});

			console.log(`${progress} ✓ ${works.length} publicaciones encontradas.`);
		} else {
			console.log(`${progress} ○ Sin publicaciones externas.`);
		}
	}

	console.log(`\n- Total publicaciones externas: ${allPublications.length}`);
	return { publications: allPublications, orcidReport };
}

module.exports = {
	enrichWithOrcid,
	extractOrcidId,
	fetchOrcidWorks,
};
