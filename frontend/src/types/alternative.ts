export interface SkillGap {
  skill: string;
  resource: string;
  estimated_time: string;
}

export interface RecommendedCourse {
  name: string;
  platform: string;
  reason: string;
}

export interface MiniProject {
  title: string;
  description: string;
  skills_covered: string[];
}

export interface AlternativeTopic {
  title: string;
  justification: string;
  delta_from_current: string;
}

export interface AlternativeRecommendationResponse {
  summary: string;
  skill_gaps_to_close: SkillGap[];
  recommended_courses: RecommendedCourse[];
  mini_projects: MiniProject[];
  alternative_topics: AlternativeTopic[];
}
