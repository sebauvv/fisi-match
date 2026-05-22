/**
 * API client for metadata endpoints:
 * - /metadata/research-areas
 * - /metadata/publication-types
 * - /metadata/thesis-subjects
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ResearchAreaItem {
  id: number;
  name: string;
  advisor_count: number;
}

export interface PublicationTypeItem {
  code: string;
  label_es: string;
  pub_count: number;
}

export interface ThesisSubjectItem {
  id: number;
  name: string;
  thesis_count: number;
}

export const metadataApi = {
  async getResearchAreas(): Promise<ResearchAreaItem[]> {
    const response = await fetch(`${API_BASE}/metadata/research-areas`);
    if (!response.ok) throw new Error('Error al obtener áreas de investigación');
    return response.json();
  },

  async getPublicationTypes(): Promise<PublicationTypeItem[]> {
    const response = await fetch(`${API_BASE}/metadata/publication-types`);
    if (!response.ok) throw new Error('Error al obtener tipos de publicación');
    return response.json();
  },

  async getThesisSubjects(): Promise<ThesisSubjectItem[]> {
    const response = await fetch(`${API_BASE}/metadata/thesis-subjects`);
    if (!response.ok) throw new Error('Error al obtener temas de tesis');
    return response.json();
  },
};
