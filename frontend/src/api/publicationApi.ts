export interface Publication {
	id: number;
	advisor_id: string;
	advisor_name: string;
	orcid: string | null;
	title: string;
	type: string | null;
	year: number | null;
	journal: string | null;
	doi: string | null;
	external_url: string | null;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const publicationApi = {
	async getPublications(advisorId: string, limit: number = 100): Promise<Publication[]> {
		const response = await fetch(`${API_BASE}/publications?advisor_id=${advisorId}&limit=${limit}`);
		if (!response.ok) throw new Error('Error al obtener publicaciones');
		return response.json();
	}
};
