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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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