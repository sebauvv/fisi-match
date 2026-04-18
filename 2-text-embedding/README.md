# Fase 2 -- Representacion Semantica (Embeddings)

## Objetivo

Transformar los datos de Fase 1 (asesores, tesis, publicaciones externas) en vectores semanticos de 1024 dimensiones usando AWS Bedrock Titan Embeddings v2. Se usa una estrategia de **multiples vectores por asesor** (1:N) para preservar la granularidad semantica.

## Estructura del modulo

```
2-text-embedding/
├── README.md
├── .gitignore
├── script/                     # Pipeline Node.js de generacion
│   ├── package.json
│   ├── config.js               # AWS region, Bedrock model, rutas
│   ├── text-builder.js         # Fase 1 data -> chunks de texto
│   ├── embedder.js             # Bedrock Titan v2 client (retry + backoff)
│   ├── generate.js             # Orquestador principal
│   └── upload-s3.js            # Sube embeddings.json a S3
├── infrastructure/             # Definiciones de base de datos
│   └── schema.sql              # DDL para PostgreSQL + pgvector
└── output/                     # Generado (no versionado)
    └── embeddings.json
```

## Estrategia Multi-Vector

En lugar de un solo vector por asesor (que diluiria la informacion semantica), se genera un vector independiente para cada pieza de conocimiento:

| Tipo | Fuente | Texto | Cantidad |
|---|---|---|---|
| `profile` | advisors.json | Areas de investigacion | 127 |
| `thesis` | theses.json | Titulo + abstract + subjects | 1,079 |
| `publication` | external_publications.json | Titulo + journal + tipo + anio | 1,105 |
| **Total** | | | **2,311 vectores** |

Ventajas:
- No hay riesgo de exceder el limite de 8,192 tokens de Titan v2.
- Fase 3 puede explicar POR QUE se recomienda un asesor (que tesis/paper hizo match).
- La busqueda kNN opera sobre chunks especificos, no promedios diluidos.

## Esquema de Base de Datos

Ver `infrastructure/schema.sql`. Dos tablas:

- **`advisors`**: metadata relacional (nombre, ORCID, areas).
- **`knowledge_vectors`**: tabla unificada de vectores con `content_type` discriminador (`profile`, `thesis`, `publication`). Indice HNSW para kNN por similitud coseno.

## Uso

```bash
cd script/

# 1. Instalar dependencias
npm install

# 2. Login AWS
aws sso login --profile " "

# 3. Dry run (sin Bedrock, solo construye chunks)
node generate.js --dry-run

# 4. Test (2 asesores)
node generate.js --limit 2

# 5. Generacion completa (~2311 vectores)
node generate.js

# 6. Upload a S3
S3_BUCKET=mi-bucket node upload-s3.js
```

## Costos

| Concepto | Calculo | Costo |
|---|---|---|
| Bedrock Titan v2 | ~431K tokens x $0.00002/1K | **$0.009** |
| S3 storage | ~50MB | **~$0.001/mes** |
| RDS (destroy+seed) | Solo cuando se necesite | **$0.00 cuando apagado** |

## Formato de embeddings.json

```json
{
  "metadata": {
    "model": "amazon.titan-embed-text-v2:0",
    "dimensions": 1024,
    "total_vectors": 2311,
    "by_type": { "profiles": 127, "theses": 1079, "publications": 1105 },
    "cost_estimated_usd": 0.009,
    "generated_at": "..."
  },
  "vectors": [
    {
      "advisor_id": "abc123",
      "advisor_name": "...",
      "content_type": "thesis",
      "content_text": "Titulo + Abstract...",
      "embedding": [0.023, -0.441, ...],
      "source_id": "uuid-o-doi",
      "year": 2024,
      "metadata": { ... }
    }
  ]
}
```

## Dependencia con otras fases

| Fase | Relacion |
|---|---|
| Fase 1 (scraper) | Input: lee JSONs de `1-scraper/output/` |
| Fase 3 (recomendacion) | Output: consume `embeddings.json` para kNN |
| db/ (infraestructura) | `schema.sql` define las tablas de pgvector |
