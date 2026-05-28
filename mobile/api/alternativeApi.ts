import { API_BASE, authHeaders } from './config';
import type { AlternativeRecommendationResponse } from '../types/alternative';

export const alternativeApi = {
  async generateAlternativeRecommendations(
    studentId: string,
    reportId: string,
    token: string,
  ): Promise<AlternativeRecommendationResponse> {
    const response = await fetch(
      `${API_BASE}/students/${studentId}/alt_recommendations/${reportId}`,
      { method: 'POST', headers: authHeaders(token) },
    );
    if (!response.ok) throw new Error(`Error: ${response.statusText}`);
    return response.json();
  },
};
