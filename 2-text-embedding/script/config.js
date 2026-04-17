/**
 * Configuracion central de Fase 2.
 */

const path = require('path');

module.exports = {
	// AWS
	aws: {
		region: 'us-east-2',
		profile: 'Ecomm-Seba',
	},

	// Bedrock Titan Embeddings v2
	bedrock: {
		modelId: 'amazon.titan-embed-text-v2:0',
		dimensions: 1024,
		// Tokens maximos por input (Titan v2 limit)
		maxInputTokens: 8192,
		// Concurrencia: 1 = secuencial (Bedrock on-demand tiene TPM bajo)
		concurrency: 1,
		// Delay entre llamadas (ms)
		batchDelay: 1000,
	},

	// Rutas de entrada (Fase 1 output)
	input: {
		advisorsJson: path.resolve(__dirname, '../../1-scraper/output/advisors.json'),
		thesesJson: path.resolve(__dirname, '../../1-scraper/output/theses.json'),
		externalPubsJson: path.resolve(__dirname, '../../1-scraper/output/external_publications.json'),
	},

	// Ruta de salida
	output: {
		dir: path.resolve(__dirname, '..', 'output'),
		embeddingsJson: 'embeddings.json',
	},

	// S3 (para upload)
	s3: {
		// Se configura via env var o parametro CLI
		bucket: process.env.S3_BUCKET || 'soft-int-proj-data',
		prefix: 'fase2/',
	},
};
