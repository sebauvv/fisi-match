// Profile returned by the API after processing PDFs

export interface Course {
  ciclo: string;
  plan: string;
  tipo: string;
  codigo: string;
  asignatura: string;
  calificacion: string;
  creditos: string;
  seccion: string;
}

export interface AcademicPeriod {
  periodo: string;
  cursos: Course[];
}

export interface CreditsSummary {
  creditaje_requerido_para_egresar: number;
  creditaje_aprobado: number;
  obligatorios: number;
  de_especialidad: number;
  electivos_generales: number;
  electivos_de_especialidad: number;
  optativos: number;
  alternativos: number;
  de_otra_especialidad: number;
  mas_de_una_vez: number;
  otros: number;
  creditaje_faltante: number;
  promedio_ponderado: number;
}

export interface StudentInfo {
  codigo_matricula: string;
  nombres_apellidos: string;
  facultad: string;
  escuela: string;
  plan: string;
}

export interface StudentProfile {
  student_id: string;
  historial: {
    estudiante: StudentInfo;
    periodos_academicos: AcademicPeriod[];
    resumen_creditos: CreditsSummary;
  };
  cv?: {
    cv_text: string;
  };
  thesis_idea: string;
  pdf_urls: {
    historial?: string;
    matricula?: string;
    cv?: string;
  };
  elapsed_seconds?: number;
}

// Stored user session
export interface AuthUser {
  student_id: string;
  email: string;
  estudiante: StudentInfo;
  periodos_academicos: AcademicPeriod[];
  resumen_creditos: CreditsSummary;
  cv_text: string;
  thesis_idea: string;
  pdf_urls: {
    historial?: string;
    matricula?: string;
    cv?: string;
  };
}

// DB stats for the dashboard
export interface DbStats {
  advisors: number;
  theses: number;
  publications: number;
  range_start: number;
  range_end: number;
}
