-- Schema para pgvector - Fase 2: Representacion Semantica
-- Base de datos: PostgreSQL + pgvector

-- Habilita a pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabla: advisors (metadata relacional)
CREATE TABLE IF NOT EXISTS advisors (
  id TEXT PRIMARY KEY,                    -- Hash SHA-256 del nombre normalizado
  full_name TEXT NOT NULL,
  name_variants TEXT[],
  thesis_count INT DEFAULT 0,
  orcid TEXT,
  advisor_dni TEXT,
  research_areas TEXT[],
  scraped_at TIMESTAMPTZ
);

-- Tabla: knowledge_vectors (indice vectorial unificado)
-- Una fila por "pieza de conocimiento" (1:N con advisors)
CREATE TABLE IF NOT EXISTS knowledge_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id TEXT NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('profile', 'thesis', 'publication')),
  content_text TEXT NOT NULL,
  embedding vector(1024) NOT NULL,
  source_id TEXT,                         -- UUID de tesis o DOI de publicacion
  year INT,                               -- Para peso temporal en recomendacion
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices

-- FK lookup
CREATE INDEX IF NOT EXISTS idx_kv_advisor_id ON knowledge_vectors(advisor_id);

-- Filtro por tipo de contenido
CREATE INDEX IF NOT EXISTS idx_kv_content_type ON knowledge_vectors(content_type);

-- Indice vectorial HNSW para busqueda kNN por similitud coseno
-- m=16, ef_construction=64 son valores por defecto adecuados para <10K vectores
CREATE INDEX IF NOT EXISTS idx_kv_embedding ON knowledge_vectors
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Indice compuesto para queries de Fase 3 (tipo + anio)
CREATE INDEX IF NOT EXISTS idx_kv_type_year ON knowledge_vectors(content_type, year);

-- Query de ejemplo: Buscar los 10 chunks mas similares a un input
-- SELECT
--   kv.advisor_id,
--   a.full_name,
--   kv.content_type,
--   kv.content_text,
--   kv.year,
--   1 - (kv.embedding <=> $1::vector) AS similarity
-- FROM knowledge_vectors kv
-- JOIN advisors a ON kv.advisor_id = a.id
-- ORDER BY kv.embedding <=> $1::vector
-- LIMIT 10;
