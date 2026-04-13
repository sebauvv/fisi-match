# Estructura del Dataset – Fase 1 Scraper v2

## Visión General

Este scraper consume la **API pública de Cybertesis UNMSM** (DSpace 7) y la **API pública de ORCID** para construir un dataset estructurado de asesores de tesis en el área de **Ingeniería de Software**. El dataset está diseñado para alimentar las fases posteriores del sistema de recomendación inteligente de asesores.

## Arquitectura del Scraper

```
1-scraper/
├── package.json              # Dependencias: axios, json2csv
├── ESTRUCTURA.md             # Este archivo
├── asesores_con_orcid.txt    # Reporte de asesores con publicaciones externas
├── src/
│   ├── config.js             # Configuración (URLs, delays, rutas)
│   ├── api-client.js         # Cliente HTTP Cybertesis (retry, backoff, paginación)
│   ├── orcid-client.js       # Cliente ORCID API v3.0 (publicaciones externas)
│   ├── parser.js             # Transformación DSpace → Advisor/Thesis schema
│   ├── exporter.js           # Exportación a JSON y CSV (3 datasets separados)
│   └── index.js              # Orquestador principal
└── output/
    ├── advisors.json          # Dataset de asesores
    ├── advisors.csv
    ├── theses.json            # Dataset de tesis
    ├── theses.csv
    ├── external_publications.json  # Publicaciones externas (ORCID)
    └── external_publications.csv
```

## Flujo de Datos

```
API Cybertesis                          API ORCID
     │                                      │
     ▼                                      ▼
┌─────────────────┐              ┌────────────────────┐
│ 1. Listar       │              │ 5. Buscar papers   │
│    Asesores     │              │    por ORCID ID     │
└────────┬────────┘              └─────────┬──────────┘
         │                                 │
         ▼                                 │
┌─────────────────┐                        │
│ 2. Obtener      │                        │
│    Tesis/asesor  │                        │
└────────┬────────┘                        │
         │                                 │
         ▼                                 │
┌─────────────────┐                        │
│ 3. Transformar  │                        │
│ 4. Deduplicar   │────────────────────────┘
│    variantes    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ 6. Exportar 3 datasets + reporte ORCID  │
└─────────────────────────────────────────┘
```

## Datasets Generados

### 1. `advisors.json/csv` – Perfiles de Asesores

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | Hash SHA-256 del nombre normalizado (PK estable) |
| `full_name` | `string` | Nombre completo tal como aparece en Cybertesis |
| `name_variants` | `string[]` | Variantes del nombre (deduplicación automática) |
| `thesis_count` | `number` | Total de tesis dirigidas |
| `orcid` | `string \| null` | ORCID del asesor |
| `advisor_dni` | `string \| null` | DNI del asesor |
| `research_areas` | `string[]` | Áreas de investigación (subjects acumulados) |
| `text_for_embedding` | `string` | **Fase 2**: texto concatenado para embeddings |
| `scraped_at` | `string` | Timestamp ISO 8601 |

### 2. `theses.json/csv` – Tesis Dirigidas

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | UUID original DSpace |
| `advisor_id` | `string` | FK al asesor |
| `advisor_name` | `string` | Nombre del asesor (para conveniencia) |
| `title` | `string` | Título (sanitizado, sin saltos de línea) |
| `abstract` | `string` | Resumen (sanitizado) |
| `author` | `string` | Autor de la tesis |
| `date_issued` | `string` | Fecha de publicación |
| `year` | `number` | **Año numérico** para peso temporal |
| `subjects` | `string[]` | Palabras clave |
| `subject_ocde` | `string[]` | Clasificación OCDE |
| `thesis_type` | `string` | Tipo (bachelor, master, doctoral) |
| `degree_*` | `string` | Campos del grado académico |
| `handle_url` | `string` | URL permanente HDL |
| `jurors` | `string[]` | Miembros del jurado |

### 3. `external_publications.json/csv` – Publicaciones Externas (ORCID)

| Campo | Tipo | Descripción |
|---|---|---|
| `advisor_id` | `string` | FK al asesor |
| `advisor_name` | `string` | Nombre del asesor |
| `orcid` | `string` | URL ORCID |
| `title` | `string` | Título de la publicación |
| `type` | `string` | Tipo (journal-article, conference-paper, etc.) |
| `year` | `number` | Año de publicación |
| `journal` | `string` | Revista o conferencia |
| `doi` | `string` | DOI de la publicación |
| `external_url` | `string` | URL externa (Scopus, DOI, etc.) |

## Decisiones de Diseño

### Datasets separados
Permite cargar independientemente en PostgreSQL:  `advisors` (tabla), `theses` (tabla con FK), `external_publications` (tabla con FK). Facilita queries JOIN y evita redundancia.

### Sanitización de texto para CSV
Abstracts y títulos de la API DSpace contienen `\r\n`. Se reemplazan por espacios para mantener consistencia de filas en CSV.

### Deduplicación de nombres
Asesores como "Gonzales Suárez" y "González Suarez" se fusionan automáticamente normalizando (lowercase + sin diacríticos). Sus tesis se combinan sin duplicados.

### Enriquecimiento ORCID
Se consulta la API pública de ORCID v3.0 para los asesores que tienen ORCID registrado en Cybertesis. El resultado se exporta como dataset independiente para no acoplar datos de fuentes distintas.

## Uso

```bash
npm install

# Ejecución completa (Cybertesis + ORCID)
npm start

# Sin ORCID (más rápido)
node src/index.js --no-orcid

# Modo test
node src/index.js --limit 5
```
