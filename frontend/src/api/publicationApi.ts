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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const publicationApi = {
    async getPublications(params: {
        limit?: number;
        offset?: number;
        advisor_id?: string;
        type?: string;
        year?: number;
        search?: string;
    }): Promise<PublicationListResponse> {
        const url = new URL(`${API_BASE}/publications`);
        if (params.limit !== undefined) url.searchParams.set('limit', String(params.limit));
        if (params.offset !== undefined) url.searchParams.set('offset', String(params.offset));
        if (params.advisor_id) url.searchParams.set('advisor_id', params.advisor_id);
        if (params.type) url.searchParams.set('type', params.type);
        if (params.year) url.searchParams.set('year', String(params.year));
        if (params.search) url.searchParams.set('search', params.search);
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error('Error al obtener publicaciones');
        return response.json();
    }
};