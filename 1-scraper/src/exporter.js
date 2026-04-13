/**
 * Módulo de exportación del dataset a JSON y CSV.
 * Genera archivos separados: advisors, theses, external_publications.
 */

const fs = require('fs');
const path = require('path');
const { Parser: CsvParser } = require('json2csv');
const config = require('./config');

/**
 * Asegura que el directorio de salida exista.
 */
function ensureOutputDir() {
	if (!fs.existsSync(config.output.dir)) {
		fs.mkdirSync(config.output.dir, { recursive: true });
		console.log(` Directorio creado: ${config.output.dir}`);
	}
}

/**
 * Escribe un CSV con manejo de campos vacíos y sin saltos de línea.
 */
function writeCsv(filePath, rows, label) {
	if (rows.length === 0) {
		console.warn(`⚠ No hay filas para exportar en ${label} CSV.`);
		return null;
	}

	const csvParser = new CsvParser({
		fields: Object.keys(rows[0]),
		eol: '\n',
	});
	const csv = csvParser.parse(rows);

	fs.writeFileSync(filePath, csv, 'utf-8');
	console.log(` ${label} CSV: ${filePath} (${rows.length} filas)`);
	return filePath;
}

/**
 * Escribe un JSON formateado.
 */
function writeJson(filePath, data, label) {
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
	console.log(` ${label} JSON: ${filePath}`);
	return filePath;
}

// ═══════════════════════════════════════════════════════════════════════
// Exportadores principales
// ═══════════════════════════════════════════════════════════════════════

/**
 * Exporta el dataset de asesores (sin tesis embebidas).
 * @param {object[]} advisors
 */
function exportAdvisors(advisors) {
	ensureOutputDir();

	// JSON - perfil del asesor sin tesis (se referencia por advisor_id)
	const advisorRecords = advisors.map((a) => ({
		id: a.id,
		full_name: a.full_name,
		name_variants: a.name_variants,
		thesis_count: a.thesis_count,
		orcid: a.orcid,
		advisor_dni: a.advisor_dni,
		research_areas: a.research_areas,
		text_for_embedding: a.text_for_embedding,
		scraped_at: a.scraped_at,
	}));

	const jsonPath = path.join(config.output.dir, config.output.advisorsJson);
	writeJson(jsonPath, {
		metadata: {
			source: 'Cybertesis UNMSM - API DSpace 7',
			scope: 'Ingeniería de Software (FISI)',
			total_advisors: advisorRecords.length,
			generated_at: new Date().toISOString(),
			version: '2.0.0',
		},
		advisors: advisorRecords,
	}, 'Advisors');

	// CSV
	const csvRows = advisorRecords.map((a) => ({
		id: a.id,
		full_name: a.full_name,
		name_variants: a.name_variants.join('; '),
		thesis_count: a.thesis_count,
		orcid: a.orcid || '',
		advisor_dni: a.advisor_dni || '',
		research_areas: a.research_areas.join('; '),
		scraped_at: a.scraped_at,
	}));

	const csvPath = path.join(config.output.dir, config.output.advisorsCsv);
	writeCsv(csvPath, csvRows, 'Advisors');
}

/**
 * Exporta el dataset de tesis (referencia advisor_id).
 * @param {object[]} advisors
 */
function exportTheses(advisors) {
	ensureOutputDir();

	// Aplana una fila por tesis con advisor_id como FK
	const thesisRecords = [];
	for (const advisor of advisors) {
		for (const thesis of advisor.theses) {
			thesisRecords.push({
				...thesis,
				advisor_id: advisor.id,
				advisor_name: advisor.full_name,
			});
		}
	}

	const jsonPath = path.join(config.output.dir, config.output.thesesJson);
	writeJson(jsonPath, {
		metadata: {
			source: 'Cybertesis UNMSM - API DSpace 7',
			total_theses: thesisRecords.length,
			generated_at: new Date().toISOString(),
			version: '2.0.0',
		},
		theses: thesisRecords,
	}, 'Theses');

	// CSV
	const csvRows = thesisRecords.map((t) => ({
		id: t.id,
		advisor_id: t.advisor_id,
		advisor_name: t.advisor_name,
		title: t.title,
		abstract: t.abstract,
		author: t.author,
		date_issued: t.date_issued,
		year: t.year || '',
		subjects: t.subjects.join('; '),
		subject_ocde: t.subject_ocde.join('; '),
		thesis_type: t.thesis_type,
		degree_level: t.degree_level,
		degree_name: t.degree_name,
		degree_discipline: t.degree_discipline,
		degree_grantor: t.degree_grantor,
		citation: t.citation,
		handle_url: t.handle_url,
		language: t.language,
		jurors: t.jurors.join('; '),
	}));

	const csvPath = path.join(config.output.dir, config.output.thesesCsv);
	writeCsv(csvPath, csvRows, 'Theses');
}

/**
 * Exporta las publicaciones externas (ORCID).
 * @param {object[]} publications - Array de { advisor_id, advisor_name, ...pub }
 */
function exportExternalPublications(publications) {
	ensureOutputDir();

	if (publications.length === 0) {
		console.log('ℹ  No se encontraron publicaciones externas.');
		return;
	}

	const jsonPath = path.join(config.output.dir, config.output.externalPublicationsJson);
	writeJson(jsonPath, {
		metadata: {
			source: 'ORCID Public API v3.0',
			total_publications: publications.length,
			generated_at: new Date().toISOString(),
			version: '2.0.0',
		},
		publications,
	}, 'External Publications');

	// CSV
	const csvRows = publications.map((p) => ({
		advisor_id: p.advisor_id,
		advisor_name: p.advisor_name,
		orcid: p.orcid,
		title: p.title,
		type: p.type,
		year: p.year || '',
		journal: p.journal || '',
		doi: p.doi || '',
		external_url: p.external_url || '',
	}));

	const csvPath = path.join(config.output.dir, config.output.externalPublicationsCsv);
	writeCsv(csvPath, csvRows, 'External Publications');
}

/**
 * Genera el reporte TXT de asesores con ORCID accesible.
 * @param {object[]} orcidEntries - Array de { name, orcid, works_count }
 */
function exportOrcidReport(orcidEntries) {
	ensureOutputDir();
	const filePath = path.join(config.output.dir, '..', config.output.orcidReport);

	const lines = [
		'════════════════════════════════════════════════════════════════',
		'  Asesores con ORCID accesible - Publicaciones Externas',
		`  Generado: ${new Date().toISOString()}`,
		'════════════════════════════════════════════════════════════════',
		'',
		`Total asesores con ORCID: ${orcidEntries.length}`,
		`Total publicaciones externas encontradas: ${orcidEntries.reduce((s, e) => s + e.works_count, 0)}`,
		'',
		'────────────────────────────────────────────────────────────────',
		'',
	];

	for (const entry of orcidEntries) {
		lines.push(`-> ${entry.name}`);
		lines.push(`   ORCID: ${entry.orcid}`);
		lines.push(`   URL: https://orcid.org/${entry.orcid_id}`);
		lines.push(`   Publicaciones encontradas: ${entry.works_count}`);
		lines.push('');
	}

	fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
	console.log(` Reporte ORCID: ${filePath}`);
}

module.exports = {
	exportAdvisors,
	exportTheses,
	exportExternalPublications,
	exportOrcidReport,
};
