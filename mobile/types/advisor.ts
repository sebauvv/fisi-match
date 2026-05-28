export interface Advisor {
  id: string;
  full_name: string;
  research_areas: string[];
  thesis_count: number;
  external_publications_count: number;
  orcid: string | null;
  advisor_dni?: string | null;
}

export interface ResearchArea {
  id: number;
  name: string;
  advisor_count: number;
}

export interface AdvisorListResponse {
  items: Advisor[];
  total: number;
  limit: number;
  offset: number;
}
