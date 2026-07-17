import { generateAdvisorRecommendation } from '../../api/recommendationApi';
import type { RecommendationResult } from '../../types/recommendation';

const mockRecommendationResponse: RecommendationResult = {
  query: 'Sistema de recomendación usando IA',
  top_k: 5,
  knn_limit: 200,
  elapsed_seconds: 2.34,
  recommendations: [
    {
      rank: 1,
      advisor_id: '1',
      advisor_name: 'Dr. Juan Pérez',
      score: 0.92,
      orcid: '0000-0001-2345-6789',
      thesis_count: 15,
      num_matching_chunks: 8,
      explanation: 'El Dr. Pérez tiene amplia experiencia en sistemas de recomendación...',
      matching_evidence: [
        { content_type: 'thesis', content_text: 'Tesis sobre recomendación', similarity: 0.95, chunk_score: 1.25, year: 2023, source_id: 'thesis-1' },
        { content_type: 'publication', content_text: 'Artículo sobre IA', similarity: 0.88, chunk_score: 1.05, year: 2024, source_id: 'pub-1' },
      ],
    },
    {
      rank: 2,
      advisor_id: '2',
      advisor_name: 'Dra. María López',
      score: 0.78,
      orcid: '0000-0002-9876-5432',
      thesis_count: 10,
      num_matching_chunks: 5,
      explanation: 'La Dra. López ha trabajado en temas de machine learning aplicado...',
      matching_evidence: [
        { content_type: 'thesis', content_text: 'Tesis sobre ML', similarity: 0.82, chunk_score: 1.10, year: 2022, source_id: 'thesis-2' },
      ],
    },
  ],
};

describe('Recommendation Flow — generateAdvisorRecommendation', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it('envía POST /recommendations con la idea de tesis', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecommendationResponse,
    });

    await generateAdvisorRecommendation('Sistema de recomendación usando IA');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/recommendations'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'Sistema de recomendación usando IA' }),
      }),
    );
  });

  it('retorna resultados ordenados por score descendente', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecommendationResponse,
    });

    const result = await generateAdvisorRecommendation('Sistema de recomendación usando IA');

    expect(result.recommendations).toHaveLength(2);
    expect(result.recommendations[0].rank).toBe(1);
    expect(result.recommendations[0].score).toBeGreaterThan(result.recommendations[1].score);
  });

  it('incluye evidencia (matching_evidence) en cada recomendación', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecommendationResponse,
    });

    const result = await generateAdvisorRecommendation('Sistema de recomendación usando IA');

    for (const rec of result.recommendations) {
      expect(rec.matching_evidence).toBeDefined();
      expect(rec.matching_evidence.length).toBeGreaterThan(0);
      for (const ev of rec.matching_evidence) {
        expect(ev).toHaveProperty('content_type');
        expect(ev).toHaveProperty('content_text');
        expect(ev).toHaveProperty('similarity');
        expect(ev).toHaveProperty('year');
      }
    }
  });

  it('maneja respuesta vacía (sin recomendaciones)', async () => {
    const emptyResponse: RecommendationResult = {
      query: 'algo muy específico',
      top_k: 5,
      knn_limit: 200,
      elapsed_seconds: 0.5,
      recommendations: [],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => emptyResponse,
    });

    const result = await generateAdvisorRecommendation('algo muy específico');
    expect(result.recommendations).toHaveLength(0);
    expect(result.elapsed_seconds).toBeGreaterThan(0);
  });

  it('lanza error cuando la API responde con error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => '{"detail":"La consulta no puede estar vacía"}',
    });

    await expect(
      generateAdvisorRecommendation(''),
    ).rejects.toThrow('Error 400');
  });

  it('lanza error con el texto de error de la API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 502,
      text: async () => '{"detail":"Error del servicio de embeddings"}',
    });

    await expect(
      generateAdvisorRecommendation('consulta'),
    ).rejects.toThrow('Error 502');
  });

  it('estructura completa del resultado incluye metadata de la consulta', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecommendationResponse,
    });

    const result = await generateAdvisorRecommendation('Sistema de recomendación usando IA');

    expect(result).toHaveProperty('query');
    expect(result).toHaveProperty('top_k');
    expect(result).toHaveProperty('knn_limit');
    expect(result).toHaveProperty('elapsed_seconds');
    expect(result).toHaveProperty('recommendations');
    expect(result.query).toBe('Sistema de recomendación usando IA');
  });
});
