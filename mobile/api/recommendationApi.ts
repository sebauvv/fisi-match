import { API_BASE } from './config';
import type { RecommendationResult } from '../types/recommendation';

export async function generateAdvisorRecommendation(idea: string): Promise<RecommendationResult> {
  const response = await fetch(`${API_BASE}/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: idea }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Error ${response.status}: ${detail}`);
  }
  return response.json();
}
