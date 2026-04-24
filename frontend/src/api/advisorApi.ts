import type { Advisor, ResearchArea } from '../types/advisor';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface AdvisorListResponse {
  items: Advisor[];
  total: number;
  limit: number;
  offset: number;
}

export const advisorApi = {
  /**
   * Obtiene asesores paginados y filtrados
   */
  async getAdvisors(
    params: {
      limit?: number;
      offset?: number;
      search_name?: string;
      search_area?: string;
      has_orcid?: boolean | null;
    }
  ): Promise<AdvisorListResponse> {
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

  /**
   * Obtiene areas de investigacion, opcionalmente filtradas
   */
  async getResearchAreas(params: { starts_with?: string; search?: string } = {}): Promise<ResearchArea[]> {
    const url = new URL(`${API_BASE}/metadata/research-areas`);
    if (params.starts_with) url.searchParams.append('starts_with', params.starts_with);
    if (params.search) url.searchParams.append('search', params.search);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Error al obtener areas de investigación');
    return response.json();
  },

  /**
   * Obtiene un asesor por su ID
   */
  async getAdvisorById(id: string): Promise<Advisor | null> {
    const response = await fetch(`${API_BASE}/advisors/${id}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Error al obtener el asesor por id');
    }
    return response.json();
  }
};
