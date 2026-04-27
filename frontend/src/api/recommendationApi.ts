const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface RecommendationResult {
	query: string;
	top_k: number;
	knn_limit: number;
	elapsed_seconds: number;
	recommendations: AdvisorRecommendation[];
}

export interface AdvisorRecommendation {
	rank: number;
	advisor_id: string;
	advisor_name: string;
	score: number;
	orcid: string;
	thesis_count: number;
	num_matching_chunks: number;
	explanation: string;
	matching_evidence: Evidence[];
}

export interface Evidence {
	content_type: string;
	content_text: string;
	similarity: number;
	chunk_score: number;
	year: number;
	source_id: string;
}

export async function generateAdvisorRecommendation(idea: string): Promise<RecommendationResult> {
	const response = await fetch(`${API_BASE}/recommendations`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query: idea }),
	});

	if (!response.ok) {
		const detail = await response.text();
		throw new Error(`Error ${response.status}: ${detail}`);
	}

	return response.json();
}
