/**
 * Parser y transformador de datos crudos de la API a la estructura del dataset.
 * Convierte las respuestas DSpace al esquema Advisor/Thesis.
 */

const crypto = require('crypto');

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Extrae el primer valor de un campo de metadata DSpace.
 * Los campos vienen como arrays de objetos { value, language, ... }.
 * @param {object} metadata - Objeto de metadata del item
 * @param {string} field - Nombre del campo (ej. 'dc.title')
 * @returns {string|null}
 */
function getMetaValue(metadata, field) {
  const arr = metadata?.[field];
  if (!arr || arr.length === 0) return null;
  return arr[0].value || null;
}

/**
 * Extrae todos los valores de un campo de metadata DSpace.
 * @param {object} metadata
 * @param {string} field
 * @returns {string[]}
 */
function getMetaValues(metadata, field) {
  const arr = metadata?.[field];
  if (!arr || arr.length === 0) return [];
  return arr.map((item) => item.value).filter(Boolean);
}

/**
 * Genera un UUID determinístico basado en un string (para deduplicación).
 * @param {string} input
 * @returns {string}
 */
function generateDeterministicId(input) {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 32);
}

/**
 * Aliases conocidos para nombres que difieren más allá de acentos.
 * Mapa: nombre_normalizado → clave_canonica
 * Se aplica DESPUÉS de normalizeName() para agrupar variantes.
 */
const KNOWN_ALIASES = new Map([
  // "Gonzales Suárez" vs "González Suarez" (s/z swap)
  ['gonzalez suarez, juan carlos', 'gonzales suarez, juan carlos'],
  // "Seclén Arana, Javier" vs "Seclen Arana, Javier Alfonso"
  ['seclen arana, javier alfonso', 'seclen arana, javier'],
  // "Dowall Reynoso, Erwin Mac" vs "Mac Dowall Reynoso, Erwin" vs "Macdowall Reynoso, Erwin"
  ['mac dowall reynoso, erwin', 'dowall reynoso, erwin mac'],
  ['macdowall reynoso, erwin', 'dowall reynoso, erwin mac'],
]);

/**
 * Normaliza un nombre para comparación (minúsculas, sin tildes).
 * Aplica aliases conocidos para edge cases.
 * @param {string} name
 * @returns {string}
 */
function normalizeName(name) {
  let normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita diacríticos
    .replace(/\s*,\s*/g, ', ')       // Normaliza espacios alrededor de comas
    .replace(/\s+/g, ' ')
    .trim();

  // Aplicar alias si existe
  if (KNOWN_ALIASES.has(normalized)) {
    normalized = KNOWN_ALIASES.get(normalized);
  }

  return normalized;
}

/**
 * Extrae el año como número de un string de fecha.
 * Soporta: "2024", "2024-01-15", "2024-01-15T00:00:00Z"
 * @param {string|null} dateStr
 * @returns {number|null}
 */
function extractYear(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

// ── Sanitizers ────────────────────────────────────────────────────────

/**
 * Sanitiza un texto eliminando saltos de línea (\r\n, \r, \n) y
 * espacios múltiples para mantener CSV en una sola línea.
 * @param {string} text
 * @returns {string}
 */
function sanitizeText(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Parsers ───────────────────────────────────────────────────────────

/**
 * Parsea una entrada de asesor de response1 (browse entry).
 * @param {object} entry
 * @returns {object} { name, count, href }
 */
function parseAdvisorEntry(entry) {
  return {
    name: entry.value?.trim() || '',
    count: entry.count || 0,
    href: entry._links?.items?.href || null,
  };
}

/**
 * Parsea un item de tesis de response2 al esquema Thesis.
 * @param {object} item - Item crudo de la API
 * @returns {object} Thesis object
 */
function parseThesisItem(item) {
  const meta = item.metadata || {};
  const dateIssued = getMetaValue(meta, 'dc.date.issued');

  return {
    id: item.uuid || item.id,
    title: sanitizeText(getMetaValue(meta, 'dc.title') || item.name || ''),
    abstract: sanitizeText(getMetaValue(meta, 'dc.description.abstract') || ''),
    author: getMetaValue(meta, 'dc.contributor.author') || '',
    date_issued: dateIssued || '',
    year: extractYear(dateIssued),
    subjects: getMetaValues(meta, 'dc.subject'),
    subject_ocde: getMetaValues(meta, 'dc.subject.ocde'),
    thesis_type: getMetaValue(meta, 'dc.type') || '',
    degree_level: getMetaValue(meta, 'renati.level') || '',
    degree_name: getMetaValue(meta, 'thesis.degree.name') || '',
    degree_discipline: getMetaValue(meta, 'thesis.degree.discipline') || '',
    degree_grantor: getMetaValue(meta, 'thesis.degree.grantor') || '',
    citation: sanitizeText(getMetaValue(meta, 'dc.identifier.citation') || ''),
    handle_url: item.handle
      ? `https://hdl.handle.net/${item.handle}`
      : getMetaValue(meta, 'dc.identifier.uri') || '',
    language: getMetaValue(meta, 'dc.language.iso') || '',
    jurors: getMetaValues(meta, 'renati.juror'),
  };
}

/**
 * Construye el perfil completo de un asesor con sus tesis ya parseadas.
 * @param {object} advisorEntry - { name, count, href }
 * @param {object[]} theses - Array de Thesis objects (ya parseados)
 * @returns {object} Advisor profile
 */
function buildAdvisorProfile(advisorEntry, theses) {
  const normalizedName = normalizeName(advisorEntry.name);
  const id = generateDeterministicId(normalizedName);

  // Acumular subjects únicos de todas las tesis
  const subjectSet = new Set();
  theses.forEach((t) => t.subjects.forEach((s) => subjectSet.add(s)));
  const researchAreas = [...subjectSet];

  // Extraer ORCID y DNI del asesor de la primera tesis que lo tenga
  let orcid = null;
  let advisorDni = null;
  for (const t of theses) {
    // Necesitamos acceder a la metadata original, pero ya la parseamos
    // Así que buscamos en los items crudos - lo haremos desde fuera
    break;
  }

  // Construir texto para embedding (Fase 2)
  // Concatena: títulos | abstracts | subjects
  const textParts = [];
  theses.forEach((t) => {
    if (t.title) textParts.push(t.title);
    if (t.abstract) textParts.push(t.abstract);
    t.subjects.forEach((s) => textParts.push(s));
  });
  const textForEmbedding = textParts.join(' | ');

  return {
    id,
    full_name: advisorEntry.name,
    name_variants: [advisorEntry.name], // Se expandirá con deduplicación
    thesis_count: theses.length,
    orcid,
    advisor_dni: advisorDni,
    research_areas: researchAreas,
    text_for_embedding: textForEmbedding,
    theses,
    scraped_at: new Date().toISOString(),
  };
}

/**
 * Construye el perfil del asesor CON acceso a los items crudos para extraer ORCID/DNI.
 * @param {object} advisorEntry - { name, count, href }
 * @param {object[]} rawItems - Items crudos de la API (response2)
 * @returns {object} Advisor profile completo
 */
function buildAdvisorProfileFromRaw(advisorEntry, rawItems) {
  const theses = rawItems.map(parseThesisItem);
  const profile = buildAdvisorProfile(advisorEntry, theses);

  // Extraer ORCID y DNI del primer item que los tenga
  for (const item of rawItems) {
    const meta = item.metadata || {};
    if (!profile.orcid) {
      profile.orcid = getMetaValue(meta, 'renati.advisor.orcid') || null;
    }
    if (!profile.advisor_dni) {
      profile.advisor_dni = getMetaValue(meta, 'renati.advisor.dni') || null;
    }
    if (profile.orcid && profile.advisor_dni) break;
  }

  return profile;
}

/**
 * Detecta y agrupa variantes de nombre entre asesores.
 * Retorna un Map: nombre_normalizado → [nombres originales]
 * @param {string[]} names
 * @returns {Map<string, string[]>}
 */
function detectNameVariants(names) {
  const groups = new Map();
  for (const name of names) {
    const key = normalizeName(name);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(name);
  }
  return groups;
}

module.exports = {
  parseAdvisorEntry,
  parseThesisItem,
  buildAdvisorProfile,
  buildAdvisorProfileFromRaw,
  detectNameVariants,
  normalizeName,
  getMetaValue,
  getMetaValues,
};
