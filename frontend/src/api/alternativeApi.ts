import type { AlternativeRecommendationResponse } from '../types/alternative';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const alternativeApi = {
  generateAlternativeRecommendations: async (studentId: string, reportId: string, token: string): Promise<AlternativeRecommendationResponse> => {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/alt_recommendations/${reportId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to generate alternative recommendations: ${response.statusText}`);
    }

    return response.json();
  }
};
