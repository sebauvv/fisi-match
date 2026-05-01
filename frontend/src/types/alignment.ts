export interface RelevantCourse {
  name: string;
  relevance: string;
}

export interface ReportJson {
  alignment_level: string;
  score_pct: number;
  topic_requirements: string;
  student_profile_summary: string;
  justification: string;
  student_strengths: string[];
  skill_gaps: string[];
  relevant_courses?: RelevantCourse[];
  relevant_cv_skills?: string[];
}

export interface AlignmentReport {
  id: string;
  student_id: string;
  thesis_idea: string;
  alignment_level: string;
  score_pct: number;
  topic_requirements?: string;
  student_profile_summary?: string;
  justification: string;
  student_strengths?: string;
  skill_gaps?: string;
  report_json: ReportJson;
  created_at: string;
}
