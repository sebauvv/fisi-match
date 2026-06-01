import { API_BASE } from './config';
import type { ThesisListResponse } from '../types/advisor';

export const thesisApi = {
  async getTheses(params: {
    limit?: number;
    offset?: number;
    advisor_id?: string;
    year?: number;
    search?: string;
  }): Promise<ThesisListResponse> {
    const url = new URL(`${API_BASE}/theses`);
    if (params.limit !== undefined) url.searchParams.set('limit', String(params.limit));
    if (params.offset !== undefined) url.searchParams.set('offset', String(params.offset));
    if (params.advisor_id) url.searchParams.set('advisor_id', params.advisor_id);
    if (params.year) url.searchParams.set('year', String(params.year));
    if (params.search) url.searchParams.set('search', params.search);
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Error al obtener tesis');
    return response.json();
  }
};
