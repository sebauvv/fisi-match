/**
 * Script principal del scraper de Cybertesis UNMSM.
 * Orquesta: fetch advisors → fetch theses → parse → dedup → enrich ORCID → export.
 *
 * Uso:
 *   node src/index.js              # Todos los asesores + enriquecimiento ORCID
 *   node src/index.js --limit 3    # Solo los primeros 3 (test)
 *   node src/index.js --no-orcid   # Sin enriquecimiento ORCID
 */

const { fetchAdvisorList, fetchAdvisorTheses } = require('./api-client');
const {
	parseAdvisorEntry,
	buildAdvisorProfileFromRaw,
	detectNameVariants,
	normalizeName,
} = require('./parser');
const {
	exportAdvisors,
	exportTheses,
	exportExternalPublications,
	exportOrcidReport,
} = require('./exporter');
const { enrichWithOrcid } = require('./orcid-client');

// ── Argumentos CLI ─────────────────────────────────────────────────

function parseArgs() {
	const args = process.argv.slice(2);
	const options = { limit: null, noOrcid: false };

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--limit' && args[i + 1]) {
			options.limit = parseInt(args[i + 1], 10);
			i++;
		}
		if (args[i] === '--no-orcid') {
			options.noOrcid = true;
		}
	}
	return options;
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
	const startTime = Date.now();
	const options = parseArgs();

	console.log('═══════════════════════════════════════════════════════');
	console.log('  🎓 Scraper Cybertesis UNMSM - Fase 1 v2');
	console.log('  📚 Área: Ingeniería de Software (FISI)');
	console.log('═══════════════════════════════════════════════════════\n');

	// 1. Obtener lista de asesores
	let advisorEntries;
	try {
		const rawEntries = await fetchAdvisorList();
		advisorEntries = rawEntries.map(parseAdvisorEntry);
	} catch (error) {
		console.error('❌ Error obteniendo lista de asesores:', error.message);
		process.exit(1);
	}

	// 2. Detectar variantes de nombre (pre-scraping)
	const allNames = advisorEntries.map((e) => e.name);
	const nameVariants = detectNameVariants(allNames);
	const duplicateGroups = [...nameVariants.entries()].filter(
		([, names]) => names.length > 1
	);

	if (duplicateGroups.length > 0) {
		console.log('🔄 Variantes de nombre detectadas (se fusionarán):');
		duplicateGroups.forEach(([normalized, names]) => {
			console.log(`   "${normalized}" → ${names.join(' | ')}`);
		});
		console.log('');
	}

	// 3. Aplicar límite si se especificó
	let entriesToProcess = advisorEntries;
	if (options.limit) {
		entriesToProcess = advisorEntries.slice(0, options.limit);
		console.log(
			`⚡ Modo limitado: procesando ${options.limit} de ${advisorEntries.length} asesores\n`
		);
	}

	// 4. Procesar cada asesor
	const advisorProfiles = [];
	const errors = [];

	for (let i = 0; i < entriesToProcess.length; i++) {
		const entry = entriesToProcess[i];
		const progress = `[${i + 1}/${entriesToProcess.length}]`;

		console.log(
			`${progress} 📖 Procesando: ${entry.name} (${entry.count} tesis)...`
		);

		if (!entry.href) {
			console.warn(`${progress} ⚠ Sin href, saltando.`);
			continue;
		}

		try {
			const rawItems = await fetchAdvisorTheses(entry.href);
			const profile = buildAdvisorProfileFromRaw(entry, rawItems);

			// Agregar variantes de nombre si existen
			const normalizedKey = normalizeName(entry.name);
			const variants = nameVariants.get(normalizedKey) || [entry.name];
			profile.name_variants = variants;

			advisorProfiles.push(profile);
			console.log(`${progress} ✓ ${rawItems.length} tesis obtenidas.`);
		} catch (error) {
			console.error(`${progress} ❌ Error: ${error.message}`);
			errors.push({ advisor: entry.name, error: error.message });
		}
	}

	// 5. Deduplicar asesores con variantes de nombre
	const mergedProfiles = mergeAdvisorVariants(advisorProfiles);
	console.log(
		`\n🔗 Deduplicación: ${advisorProfiles.length} → ${mergedProfiles.length} asesores únicos`
	);

	// 6. Enriquecimiento ORCID (publicaciones externas)
	let externalPublications = [];
	let orcidReport = [];

	if (!options.noOrcid) {
		const orcidResult = await enrichWithOrcid(mergedProfiles);
		externalPublications = orcidResult.publications;
		orcidReport = orcidResult.orcidReport;
	} else {
		console.log('\n⏭  Enriquecimiento ORCID omitido (--no-orcid)');
	}

	// 7. Exportar datasets separados
	console.log('\n───────────────────────────────────────────────────────');
	console.log('📦 Exportando datasets...\n');

	exportAdvisors(mergedProfiles);
	exportTheses(mergedProfiles);
	exportExternalPublications(externalPublications);

	if (orcidReport.length > 0) {
		exportOrcidReport(orcidReport);
	}

	// 8. Resumen final
	const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
	const totalTheses = mergedProfiles.reduce(
		(s, a) => s + a.theses.length,
		0
	);

	console.log('\n═══════════════════════════════════════════════════════');
	console.log('!   Resumen Final');
	console.log('═══════════════════════════════════════════════════════');
	console.log(`-   Tiempo total: ${elapsed}s`);
	console.log(`-   Asesores únicos: ${mergedProfiles.length}`);
	console.log(`-   Tesis totales: ${totalTheses}`);
	console.log(`-   Publicaciones externas (ORCID): ${externalPublications.length}`);
	console.log(`-   Asesores con ORCID: ${orcidReport.length}`);

	if (errors.length > 0) {
		console.log(`\n  ⚠ Errores (${errors.length}):`);
		errors.forEach((e) => console.log(`     - ${e.advisor}: ${e.error}`));
	}

	console.log('\nScraping completado.');
}

/**
 * Fusiona perfiles de asesores que tienen el mismo ID (nombre normalizado).
 * Combina sus tesis, variantes y research areas.
 * @param {object[]} profiles
 * @returns {object[]}
 */
function mergeAdvisorVariants(profiles) {
	const merged = new Map();

	for (const profile of profiles) {
		if (merged.has(profile.id)) {
			const existing = merged.get(profile.id);

			// Fusionar variantes
			const variantSet = new Set([
				...existing.name_variants,
				...profile.name_variants,
			]);
			existing.name_variants = [...variantSet];

			// Fusionar tesis (evitar duplicados por UUID)
			const existingIds = new Set(existing.theses.map((t) => t.id));
			const newTheses = profile.theses.filter((t) => !existingIds.has(t.id));
			existing.theses.push(...newTheses);
			existing.thesis_count = existing.theses.length;

			// Re-calcular research areas
			const areaSet = new Set([
				...existing.research_areas,
				...profile.research_areas,
			]);
			existing.research_areas = [...areaSet];

			// Re-calcular text_for_embedding
			const textParts = [];
			existing.theses.forEach((t) => {
				if (t.title) textParts.push(t.title);
				if (t.abstract) textParts.push(t.abstract);
				t.subjects.forEach((s) => textParts.push(s));
			});
			existing.text_for_embedding = textParts.join(' | ');

			// Tomar ORCID/DNI si el existente no tiene
			if (!existing.orcid && profile.orcid) existing.orcid = profile.orcid;
			if (!existing.advisor_dni && profile.advisor_dni)
				existing.advisor_dni = profile.advisor_dni;

			// Usar el nombre con más acentos como full_name principal
			if (profile.full_name.length > existing.full_name.length) {
				existing.full_name = profile.full_name;
			}
		} else {
			merged.set(profile.id, { ...profile });
		}
	}

	return [...merged.values()];
}

// ── Run ────────────────────────────────────────────────────────────

main().catch((error) => {
	console.error('\nxd Error fatal:', error);
	process.exit(1);
});
