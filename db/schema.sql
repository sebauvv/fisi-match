-- Schema pgvector: Representacion Semantica de Asesores
-- PostgreSQL 16 + pgvector

CREATE EXTENSION IF NOT EXISTS vector;

-- Metadata relacional de asesores
CREATE TABLE IF NOT EXISTS advisors (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  name_variants TEXT[],
  thesis_count INT DEFAULT 0,
  orcid TEXT,
  advisor_dni TEXT,
  research_areas TEXT[],
  scraped_at TIMESTAMPTZ
);

-- Indice vectorial unificado (1:N con advisors)
-- Cada fila representa una pieza de conocimiento del asesor
CREATE TABLE IF NOT EXISTS knowledge_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id TEXT NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('profile', 'thesis', 'publication')),
  content_text TEXT NOT NULL,
  embedding vector(1024) NOT NULL,
  source_id TEXT,
  year INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices relacionales
CREATE INDEX IF NOT EXISTS idx_kv_advisor_id ON knowledge_vectors(advisor_id);
CREATE INDEX IF NOT EXISTS idx_kv_content_type ON knowledge_vectors(content_type);
CREATE INDEX IF NOT EXISTS idx_kv_type_year ON knowledge_vectors(content_type, year);

-- Indice HNSW para busqueda kNN por similitud coseno
-- m=16: conexiones por nodo (balance entre velocidad y recall)
-- ef_construction=64: calidad de construccion (mayor = mejor recall, mas lento al insertar)
-- Para 2311 vectores este parametro es optimo; IVFFlat no se justifica bajo 10K registros
CREATE INDEX IF NOT EXISTS idx_kv_embedding ON knowledge_vectors
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
