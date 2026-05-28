export interface Evidence {
  content_type: string;
  content_text: string;
  similarity: number;
  chunk_score: number;
  year: number;
  source_id: string;
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

export interface RecommendationResult {
  query: string;
  top_k: number;
  knn_limit: number;
  elapsed_seconds: number;
  recommendations: AdvisorRecommendation[];
}
