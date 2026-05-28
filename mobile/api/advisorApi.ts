import { API_BASE } from './config';
import type { Advisor, AdvisorListResponse, ResearchArea } from '../types/advisor';

export const advisorApi = {
  async getAdvisors(params: {
    limit?: number;
    offset?: number;
    search_name?: string;
    search_area?: string;
    has_orcid?: boolean | null;
  }): Promise<AdvisorListResponse> {
    const url = new URL(`${API_BASE}/advisors`);
    if (params.limit !== undefined) url.searchParams.append('limit', params.limit.toString());
    if (params.offset !== undefined) url.searchParams.append('offset', params.offset.toString());
    if (params.search_name) url.searchParams.append('search_name', params.search_name);
    if (params.search_area) url.searchParams.append('search_area', params.search_area);
    if (params.has_orcid !== undefined && params.has_orcid !== null) {
      url.searchParams.append('has_orcid', params.has_orcid ? 'true' : 'false');
    }
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Error al obtener asesores');
    return response.json();
  },

  async getResearchAreas(): Promise<ResearchArea[]> {
    const response = await fetch(`${API_BASE}/metadata/research-areas`);
    if (!response.ok) throw new Error('Error al obtener areas');
    return response.json();
  },

  async getAdvisorById(id: string): Promise<Advisor | null> {
    const response = await fetch(`${API_BASE}/advisors/${id}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Error al obtener asesor');
    }
    return response.json();
  },
};
