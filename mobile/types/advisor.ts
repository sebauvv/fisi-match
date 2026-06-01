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

export interface Publication {
  id: number;
  advisor_id: string | null;
  advisor_name: string | null;
  orcid: string | null;
  title: string;
  type: string | null;
  year: number | null;
  journal: string | null;
  doi: string | null;
  external_url: string | null;
}

export interface PublicationListResponse {
  items: Publication[];
  total: number;
}

export interface Thesis {
  id: string;
  title: string;
  author: string | null;
  year: number | null;
  advisor_name: string | null;
  advisor_id: string | null;
  degree_level: string | null;
  degree_name: string | null;
  handle_url: string | null;
}

export interface ThesisListResponse {
  items: Thesis[];
  total: number;
}
