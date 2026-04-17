/**
 * Constructor de chunks de texto a partir de los datos de Fase 1.
 * Produce un array de objetos listos para embedding, cada uno con:
 *   - advisor_id, advisor_name, content_type, content_text, source_id, year, metadata
 */

const fs = require('fs');
const config = require('./config');

/**
 * Lee y parsea un JSON de Fase 1
 */
function loadJson(filePath) {
	const raw = fs.readFileSync(filePath, 'utf-8');
	return JSON.parse(raw);
}

/**
 * trunca un texto a un numero estimado de tokens
 * Estimacion: 1 token ~ 4 caracteres para español
 */
function truncateToTokens(text, maxTokens) {
	const maxChars = maxTokens * 4;
	if (text.length <= maxChars) return text;
	return text.slice(0, maxChars);
}

// -- Builders por tipo de contenido --

/**
 * construye el chunk de perfil del asesor
 * Texto: areas de investigacion concatenadas
 */
function buildProfileChunk(advisor) {
	const areas = (advisor.research_areas || []).join(', ');
	const text = `Areas de investigacion del asesor ${advisor.full_name}: ${areas}`;

	if (!areas || areas.length < 5) return null;

	return {
		advisor_id: advisor.id,
		advisor_name: advisor.full_name,
		content_type: 'profile',
		content_text: truncateToTokens(text, config.bedrock.maxInputTokens),
		source_id: advisor.id,
		year: null,
		metadata: {
			orcid: advisor.orcid || null,
			thesis_count: advisor.thesis_count,
		},
	};
}

/**
 * construye el chunk de una tesis
 * Texto: titulo + abstract + subjects.
 */
function buildThesisChunk(thesis) {
	const parts = [];
	if (thesis.title) parts.push(thesis.title);
	if (thesis.abstract) parts.push(thesis.abstract);
	if (thesis.subjects && thesis.subjects.length > 0) {
		parts.push('Temas: ' + thesis.subjects.join(', '));
	}

	const text = parts.join('. ');
	if (text.length < 10) return null;

	return {
		advisor_id: thesis.advisor_id,
		advisor_name: thesis.advisor_name,
		content_type: 'thesis',
		content_text: truncateToTokens(text, config.bedrock.maxInputTokens),
		source_id: thesis.id,
		year: thesis.year || null,
		metadata: {
			author: thesis.author || null,
			degree_discipline: thesis.degree_discipline || null,
			handle_url: thesis.handle_url || null,
		},
	};
}

/**
 * construye el chunk de una publicacion externa
 * Texto: titulo + journal + tipo + anio.
 */
function buildPublicationChunk(pub) {
	const parts = [];
	if (pub.title) parts.push(pub.title);
	if (pub.journal) parts.push(`Publicado en: ${pub.journal}`);
	if (pub.type) parts.push(`Tipo: ${pub.type}`);
	if (pub.year) parts.push(`Anio: ${pub.year}`);

	const text = parts.join('. ');
	if (text.length < 10) return null;

	return {
		advisor_id: pub.advisor_id,
		advisor_name: pub.advisor_name,
		content_type: 'publication',
		content_text: truncateToTokens(text, config.bedrock.maxInputTokens),
		source_id: pub.doi || null,
		year: pub.year || null,
		metadata: {
			doi: pub.doi || null,
			journal: pub.journal || null,
			external_url: pub.external_url || null,
			type: pub.type || null,
		},
	};
}

/**
 * construye todos los chunks a partir de los datos de Fase 1.
 * @param {object} options - { limit: number|null }
 * @returns {{ chunks: object[], stats: object }}
 */
function buildAllChunks(options = {}) {
	const advisorsData = loadJson(config.input.advisorsJson);
	const thesesData = loadJson(config.input.thesesJson);
	const pubsData = loadJson(config.input.externalPubsJson);

	let advisors = advisorsData.advisors;
	if (options.limit) {
		advisors = advisors.slice(0, options.limit);
	}

	const advisorIds = new Set(advisors.map((a) => a.id));

	const chunks = [];
	let profileCount = 0;
	let thesisCount = 0;
	let pubCount = 0;
	let skipped = 0;

	// 1. chunks de perfil
	for (const advisor of advisors) {
		const chunk = buildProfileChunk(advisor);
		if (chunk) {
			chunks.push(chunk);
			profileCount++;
		} else {
			skipped++;
		}
	}

	// 2. chunks de tesis (filtrado por advisor_id si hay limit)
	for (const thesis of thesesData.theses) {
		if (options.limit && !advisorIds.has(thesis.advisor_id)) continue;
		const chunk = buildThesisChunk(thesis);
		if (chunk) {
			chunks.push(chunk);
			thesisCount++;
		} else {
			skipped++;
		}
	}

	// 3. chunks de publicaciones externas
	for (const pub of pubsData.publications) {
		if (options.limit && !advisorIds.has(pub.advisor_id)) continue;
		const chunk = buildPublicationChunk(pub);
		if (chunk) {
			chunks.push(chunk);
			pubCount++;
		} else {
			skipped++;
		}
	}

	// estima tokens
	const totalChars = chunks.reduce((sum, c) => sum + c.content_text.length, 0);
	const estimatedTokens = Math.round(totalChars / 4);

	const stats = {
		profiles: profileCount,
		theses: thesisCount,
		publications: pubCount,
		total: chunks.length,
		skipped,
		estimatedTokens,
		estimatedCostUsd: +(estimatedTokens / 1000 * 0.00002).toFixed(6),
	};

	return { chunks, stats };
}

module.exports = {
	buildAllChunks,
	buildProfileChunk,
	buildThesisChunk,
	buildPublicationChunk,
};
