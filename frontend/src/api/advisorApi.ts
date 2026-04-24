import type { Advisor, ResearchArea, AdvisorFilters } from '../types/advisor';
import advisorsData from '../data/mockAdvisors.json';
import researchAreasData from '../data/mockResearchAreas.json';

const advisors: Advisor[] = advisorsData as Advisor[];
const researchAreas: ResearchArea[] = researchAreasData as ResearchArea[];

// Simulate network delay
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const advisorApi = {
  /**
   * Search advisors by name with optional orcid filter
   */
  async searchByName(
    query: string,
    filters: AdvisorFilters = {}
  ): Promise<Advisor[]> {
    await delay(200);
    const q = query.toLowerCase().trim();
    return advisors.filter((a) => {
      const nameMatch = q === '' || a.full_name.toLowerCase().includes(q);
      const orcidMatch =
        filters.hasOrcid === null || filters.hasOrcid === undefined
          ? true
          : filters.hasOrcid
          ? a.orcid !== null
          : a.orcid === null;
      return nameMatch && orcidMatch;
    });
  },

  /**
   * Get advisors by research area name (exact match)
   */
  async getAdvisorsByArea(
    areaName: string,
    filters: AdvisorFilters = {}
  ): Promise<Advisor[]> {
    await delay(200);
    return advisors.filter((a) => {
      const areaMatch = a.research_areas.some(
        (area) => area.toLowerCase() === areaName.toLowerCase()
      );
      const orcidMatch =
        filters.hasOrcid === null || filters.hasOrcid === undefined
          ? true
          : filters.hasOrcid
          ? a.orcid !== null
          : a.orcid === null;
      return areaMatch && orcidMatch;
    });
  },

  /**
   * Get all research areas, grouped by first letter (Spanish alphabet aware)
   */
  async getResearchAreas(): Promise<ResearchArea[]> {
    await delay(100);
    return researchAreas;
  },

  /**
   * Search research areas by name (fuzzy)
   */
  async searchResearchAreas(query: string): Promise<ResearchArea[]> {
    await delay(150);
    const q = query.toLowerCase().trim();
    if (!q) return researchAreas;
    return researchAreas.filter((a) => a.name.toLowerCase().includes(q));
  },

  /**
   * Get a single advisor by id
   */
  async getAdvisorById(id: string): Promise<Advisor | null> {
    await delay(150);
    return advisors.find((a) => a.id === id) ?? null;
  },
};
