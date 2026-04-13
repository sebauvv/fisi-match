/**
 * Configuración central del scraper.
 * Todos los parámetros de la API y del scraping se centralizan aquí.
 */

const path = require('path');

module.exports = {
  // ── API Cybertesis UNMSM ──────────────────────────────────────────
  api: {
    baseUrl: 'https://cybertesis.unmsm.edu.pe/backend/api',
    // Scope de Ingeniería de Software (FISI)
    scopeId: 'c7f57711-06e9-4821-8ccb-639c2874b28b',
    // Endpoint para listar asesores (browse entries)
    advisorEntriesPath: '/discover/browses/advisor/entries',
    // Tamaño de página para la lista de asesores
    advisorPageSize: 200,
    // Tamaño de página para las tesis de cada asesor
    thesesPageSize: 100,
  },

  // ── ORCID API ─────────────────────────────────────────────────────
  orcid: {
    baseUrl: 'https://pub.orcid.org/v3.0',
    // Delay entre requests ORCID (ms)
    requestDelay: 1000,
  },

  // ── Rate Limiting ─────────────────────────────────────────────────
  scraping: {
    // Delay entre requests (ms) - respetar el servidor
    requestDelay: 800,
    // Reintentos en caso de error
    maxRetries: 3,
    // Backoff base (ms) - se multiplica exponencialmente
    retryBackoff: 2000,
    // Timeout por request (ms)
    requestTimeout: 15000,
  },

  // ── Rutas de Salida ───────────────────────────────────────────────
  output: {
    dir: path.resolve(__dirname, '..', 'output'),
    // Datasets separados
    advisorsJson: 'advisors.json',
    advisorsCsv: 'advisors.csv',
    thesesJson: 'theses.json',
    thesesCsv: 'theses.csv',
    externalPublicationsJson: 'external_publications.json',
    externalPublicationsCsv: 'external_publications.csv',
    // Reporte de asesores con ORCID
    orcidReport: 'asesores_con_orcid.txt',
  },
};
