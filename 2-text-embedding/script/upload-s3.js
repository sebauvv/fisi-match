/**
 * Sube embeddings.json y datos de Fase 1 a S3.
 *
 * Uso:
 *   node src/upload-s3.js
 *   S3_BUCKET=mi-bucket node src/upload-s3.js
 */

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { fromSSO } = require('@aws-sdk/credential-providers');
const config = require('./config');

const s3 = new S3Client({
  region: config.aws.region,
  credentials: fromSSO({ profile: config.aws.profile }),
});

async function uploadFile(localPath, s3Key) {
  const body = fs.readFileSync(localPath);
  const sizeMb = (body.length / (1024 * 1024)).toFixed(2);

  await s3.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: s3Key,
      Body: body,
      ContentType: 'application/json',
    })
  );

  console.log(`  Subido: s3://${config.s3.bucket}/${s3Key} (${sizeMb} MB)`);
}

async function main() {
  console.log('================================================================');
  console.log('  Upload a S3');
  console.log(`  Bucket: ${config.s3.bucket}`);
  console.log('================================================================\n');

  const files = [
    // Fase 2 output
    {
      local: path.join(config.output.dir, config.output.embeddingsJson),
      key: `${config.s3.prefix}embeddings.json`,
    },
    // Fase 1 data (para seed de RDS)
    {
      local: config.input.advisorsJson,
      key: `fase1/advisors.json`,
    },
    {
      local: config.input.thesesJson,
      key: `fase1/theses.json`,
    },
    {
      local: config.input.externalPubsJson,
      key: `fase1/external_publications.json`,
    },
  ];

  for (const file of files) {
    if (!fs.existsSync(file.local)) {
      console.log(`  SKIP: ${file.local} (no existe)`);
      continue;
    }
    await uploadFile(file.local, file.key);
  }

  console.log('\nUpload completado.');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
