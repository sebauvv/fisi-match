export interface Thesis {
	id: string;
	title: string;
	author: string;
	year: number;
	advisor_name: string;
	advisor_id: string;
	degree_level: string;
	degree_name: string | null;
	handle_url: string | null;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const thesisApi = {
	async getTheses(advisorId: string, limit: number = 100): Promise<Thesis[]> {
		const response = await fetch(`${API_BASE}/theses?advisor_id=${advisorId}&limit=${limit}`);
		if (!response.ok) throw new Error('Error al obtener tesis');
		return response.json();
	}
};
