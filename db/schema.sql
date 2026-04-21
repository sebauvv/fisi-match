-- Schema pgvector: Representacion Semantica de Asesores
-- PostgreSQL 16 + pgvector
-- Tablas de catalogos y datos fuente agregadas en fase de UI/API

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

-- Campo adicional en advisors para conteo de publicaciones externas
ALTER TABLE advisors
  ADD COLUMN IF NOT EXISTS external_publications_count INT DEFAULT 0;

-- Areas de investigacion de asesores
CREATE TABLE IF NOT EXISTS research_areas (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  advisor_count INT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ra_name ON research_areas(name);

-- Temas de tesis
CREATE TABLE IF NOT EXISTS thesis_subjects (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  thesis_count INT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ts_name ON thesis_subjects(name);

-- Catalogo del tipo de publicacion externa de un asesor con etiqueta en español
CREATE TABLE IF NOT EXISTS publication_types (
  code      TEXT PRIMARY KEY,
  label_es  TEXT NOT NULL,
  pub_count INT DEFAULT 0
);

-- Registro de las tesis scrapeadas de Cybertesis
CREATE TABLE IF NOT EXISTS theses (
  id                TEXT PRIMARY KEY,
  title             TEXT NOT NULL,
  abstract          TEXT,
  author            TEXT,
  date_issued       TEXT,
  year              INT,
  subjects          TEXT[],
  subject_ocde      TEXT[],
  thesis_type       TEXT,
  degree_level      TEXT,
  degree_name       TEXT,
  degree_discipline TEXT,
  degree_grantor    TEXT,
  citation          TEXT,
  handle_url        TEXT,
  language          TEXT,
  jurors            TEXT[],
  advisor_id        TEXT REFERENCES advisors(id) ON DELETE SET NULL,
  advisor_name      TEXT
);
CREATE INDEX IF NOT EXISTS idx_theses_advisor_id ON theses(advisor_id);
CREATE INDEX IF NOT EXISTS idx_theses_year ON theses(year);

-- Publicaciones externas de asesores obtenidas desde ORCID/Scopus
CREATE TABLE IF NOT EXISTS external_publications (
  id           SERIAL PRIMARY KEY,
  advisor_id   TEXT REFERENCES advisors(id) ON DELETE SET NULL,
  advisor_name TEXT,
  orcid        TEXT,
  title        TEXT NOT NULL,
  type         TEXT REFERENCES publication_types(code),
  year         INT,
  journal      TEXT,
  doi          TEXT,
  external_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_ep_advisor_id ON external_publications(advisor_id);
CREATE INDEX IF NOT EXISTS idx_ep_type ON external_publications(type);
CREATE INDEX IF NOT EXISTS idx_ep_year ON external_publications(year);

-- para actualizar external_publications_count en advisors luego del seed:
-- UPDATE advisors a
--   SET external_publications_count = (
--     SELECT COUNT(*) FROM external_publications ep WHERE ep.advisor_id = a.id
--   );
