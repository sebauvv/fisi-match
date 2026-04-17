/**
 * Orquestador principal de Fase 2.
 * Lee datos de Fase 1 -> construye chunks -> genera embeddings -> escribe JSON.
 *
 * Uso:
 *   node src/generate.js              # Todos los asesores
 *   node src/generate.js --limit 2    # Solo 2 asesores (test)
 *   node src/generate.js --dry-run    # Solo construye chunks, sin llamar a Bedrock
 */

const fs = require('fs');
const path = require('path');
const { buildAllChunks } = require('./text-builder');
const { embedBatch } = require('./embedder');
const config = require('./config');

// CLI args

function parseArgs() {
	const args = process.argv.slice(2);
	const options = { limit: null, dryRun: false };

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--limit' && args[i + 1]) {
			options.limit = parseInt(args[i + 1], 10);
			i++;
		}
		if (args[i] === '--dry-run') {
			options.dryRun = true;
		}
	}
	return options;
}

// Main

async function main() {
	const startTime = Date.now();
	const options = parseArgs();

	console.log('================================================================');
	console.log('  Fase 2 - Generacion de Embeddings Multi-Vector');
	console.log('  Modelo: Amazon Titan Embed Text v2 (1024d)');
	console.log('================================================================\n');

	// 1. construye chunks de texto
	console.log('1. Construyendo chunks de texto desde Fase 1...');
	const { chunks, stats } = buildAllChunks({ limit: options.limit });

	console.log(`   Perfiles:       ${stats.profiles}`);
	console.log(`   Tesis:          ${stats.theses}`);
	console.log(`   Publicaciones:  ${stats.publications}`);
	console.log(`   Total chunks:   ${stats.total}`);
	console.log(`   Tokens est.:    ${stats.estimatedTokens.toLocaleString()}`);
	console.log(`   Costo est.:     $${stats.estimatedCostUsd}`);
	console.log(`   Skipped:        ${stats.skipped}\n`);

	if (options.dryRun) {
		console.log('[DRY RUN] No se generaran embeddings.');
		console.log('Ejemplo de chunk:');
		console.log(JSON.stringify(chunks[0], null, 2));
		return;
	}

	// 2. genera embeddings via Bedrock
	console.log('2. Generando embeddings via Bedrock Titan v2...');
	console.log(`   Concurrencia: ${config.bedrock.concurrency}\n`);

	const embeddedChunks = await embedBatch(chunks, (completed, total) => {
		const pct = ((completed / total) * 100).toFixed(1);
		process.stdout.write(`   [${completed}/${total}] ${pct}%\r`);
	});

	console.log(''); // newline after progress

	// filtra errores
	const successful = embeddedChunks.filter((c) => c.embedding !== null);
	const failed = embeddedChunks.filter((c) => c.embedding === null);

	if (failed.length > 0) {
		console.log(`   WARN: ${failed.length} chunks fallaron.`);
	}

	// 3. Escribe el output
	console.log('\n3. Escribiendo embeddings.json...');

	if (!fs.existsSync(config.output.dir)) {
		fs.mkdirSync(config.output.dir, { recursive: true });
	}

	// remueve content_text del output para reducir tamano
	// (se puede reconstruir desde Fase 1)
	const outputVectors = successful.map((c) => ({
		advisor_id: c.advisor_id,
		advisor_name: c.advisor_name,
		content_type: c.content_type,
		content_text: c.content_text,
		embedding: c.embedding,
		source_id: c.source_id,
		year: c.year,
		metadata: c.metadata,
	}));

	const output = {
		metadata: {
			model: config.bedrock.modelId,
			dimensions: config.bedrock.dimensions,
			total_vectors: outputVectors.length,
			by_type: {
				profiles: outputVectors.filter((v) => v.content_type === 'profile').length,
				theses: outputVectors.filter((v) => v.content_type === 'thesis').length,
				publications: outputVectors.filter((v) => v.content_type === 'publication').length,
			},
			total_tokens_estimated: stats.estimatedTokens,
			cost_estimated_usd: stats.estimatedCostUsd,
			generated_at: new Date().toISOString(),
		},
		vectors: outputVectors,
	};

	const outputPath = path.join(config.output.dir, config.output.embeddingsJson);
	fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

	const fileSizeMb = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);

	// 4. resumen
	const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

	console.log('\n================================================================');
	console.log('  Resumen');
	console.log('================================================================');
	console.log(`  Tiempo:        ${elapsed}s`);
	console.log(`  Vectores:      ${output.metadata.total_vectors}`);
	console.log(`    Perfiles:    ${output.metadata.by_type.profiles}`);
	console.log(`    Tesis:       ${output.metadata.by_type.theses}`);
	console.log(`    Pub. ext:    ${output.metadata.by_type.publications}`);
	console.log(`  Dimension:     ${config.bedrock.dimensions}`);
	console.log(`  Archivo:       ${outputPath} (${fileSizeMb} MB)`);
	console.log(`  Costo est.:    $${stats.estimatedCostUsd}`);

	if (failed.length > 0) {
		console.log(`\n  Errores (${failed.length}):`);
		failed.forEach((f) =>
			console.log(`    - ${f.content_type}/${f.source_id}: ${f.error}`)
		);
	}

	console.log('\nFase 2 completada.');
}

main().catch((error) => {
	console.error('\nError fatal:', error);
	process.exit(1);
});
