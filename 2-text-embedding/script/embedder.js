/**
 * Cliente de AWS Bedrock para generar embeddings con Titan Embeddings v2.
 * Maneja concurrencia controlada, rate limiting y reintentos.
 */

const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require('@aws-sdk/client-bedrock-runtime');
const { fromSSO } = require('@aws-sdk/credential-providers');
const config = require('./config');

let client = null;

/**
 * Inicializa el cliente de Bedrock con credenciales SSO.
 */
function getClient() {
  if (!client) {
    client = new BedrockRuntimeClient({
      region: config.aws.region,
      credentials: fromSSO({ profile: config.aws.profile }),
    });
  }
  return client;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Genera el embedding de un texto usando Titan Embeddings v2.
 * @param {string} text - Texto a embedear
 * @returns {Promise<number[]>} Vector de 1024 dimensiones
 */
async function getEmbedding(text) {
  const bedrockClient = getClient();

  const payload = {
    inputText: text,
    dimensions: config.bedrock.dimensions,
  };

  const command = new InvokeModelCommand({
    modelId: config.bedrock.modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  return responseBody.embedding;
}

/**
 * Genera embeddings para un batch de chunks con concurrencia controlada.
 * @param {object[]} chunks - Array de text chunks
 * @param {function} onProgress - Callback (completed, total)
 * @returns {Promise<object[]>} Chunks con embedding agregado
 */
async function embedBatch(chunks, onProgress) {
  const results = [];
  const concurrency = config.bedrock.concurrency;
  let completed = 0;
  const maxRetries = 3;

  for (let i = 0; i < chunks.length; i += concurrency) {
    const batch = chunks.slice(i, i + concurrency);

    const promises = batch.map(async (chunk) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const embedding = await getEmbedding(chunk.content_text);
          return { ...chunk, embedding };
        } catch (error) {
          const isThrottle =
            error.name === 'ThrottlingException' ||
            error.message?.includes('Too many requests');

          if (isThrottle && attempt < maxRetries) {
            const delay = 3000 * Math.pow(2, attempt - 1);
            await sleep(delay);
            continue;
          }

          if (attempt === maxRetries) {
            console.error(
              `  Error embedding (${chunk.content_type}/${chunk.source_id}): ${error.message}`
            );
            return { ...chunk, embedding: null, error: error.message };
          }
        }
      }
    });

    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    completed += batch.length;

    if (onProgress) onProgress(completed, chunks.length);

    // Rate limit entre batches
    if (i + concurrency < chunks.length) {
      await sleep(config.bedrock.batchDelay);
    }
  }

  return results;
}

module.exports = {
  getEmbedding,
  embedBatch,
};
