import { API_BASE, authHeaders } from './config';
import type { AuthUser } from '../types/student';

// Shape returned by the backend /students/{id} endpoint (flat StudentRead)
interface StudentRead {
  student_id: string;
  email: string;
  codigo_matricula: string;
  nombres_apellidos: string;
  facultad?: string;
  escuela?: string;
  plan?: string;
  pdf_url_historial?: string;
  pdf_url_matricula?: string;
  pdf_url_cv?: string;
  periodos_academicos?: any;
  cv_text?: string;
  thesis_idea: string;
  resumen_creditos: {
    creditaje_requerido_para_egresar?: number;
    creditaje_aprobado?: number;
    obligatorios?: number;
    de_especialidad?: number;
    electivos_generales?: number;
    electivos_de_especialidad?: number;
    optativos?: number;
    alternativos?: number;
    de_otra_especialidad?: number;
    mas_de_una_vez?: number;
    otros?: number;
    creditaje_faltante?: number;
    promedio_ponderado?: number;
  };
}

// Maps the flat backend StudentRead → nested AuthUser shape used throughout the app
function mapStudentReadToAuthUser(raw: StudentRead): AuthUser {
  return {
    student_id: raw.student_id,
    email: raw.email,
    estudiante: {
      codigo_matricula: raw.codigo_matricula,
      nombres_apellidos: raw.nombres_apellidos,
      facultad: raw.facultad ?? '',
      escuela: raw.escuela ?? '',
      plan: raw.plan ?? '',
    },
    periodos_academicos: raw.periodos_academicos ?? [],
    resumen_creditos: {
      creditaje_requerido_para_egresar: raw.resumen_creditos?.creditaje_requerido_para_egresar ?? 0,
      creditaje_aprobado: raw.resumen_creditos?.creditaje_aprobado ?? 0,
      obligatorios: raw.resumen_creditos?.obligatorios ?? 0,
      de_especialidad: raw.resumen_creditos?.de_especialidad ?? 0,
      electivos_generales: raw.resumen_creditos?.electivos_generales ?? 0,
      electivos_de_especialidad: raw.resumen_creditos?.electivos_de_especialidad ?? 0,
      optativos: raw.resumen_creditos?.optativos ?? 0,
      alternativos: raw.resumen_creditos?.alternativos ?? 0,
      de_otra_especialidad: raw.resumen_creditos?.de_otra_especialidad ?? 0,
      mas_de_una_vez: raw.resumen_creditos?.mas_de_una_vez ?? 0,
      otros: raw.resumen_creditos?.otros ?? 0,
      creditaje_faltante: raw.resumen_creditos?.creditaje_faltante ?? 0,
      promedio_ponderado: raw.resumen_creditos?.promedio_ponderado ?? 0,
    },
    cv_text: raw.cv_text ?? '',
    thesis_idea: raw.thesis_idea ?? '',
    pdf_urls: {
      historial: raw.pdf_url_historial,
      matricula: raw.pdf_url_matricula,
      cv: raw.pdf_url_cv,
    },
  };
}

export async function getStudent(studentId: string, token: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE}/students/${studentId}`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al obtener el perfil');
  }
  const raw: StudentRead = await response.json();
  return mapStudentReadToAuthUser(raw);
}

export async function updateStudent(
  studentId: string,
  token: string,
  data: Partial<{
    thesis_idea: string;
    cv_text: string;
    nombres_apellidos: string;
    codigo_matricula: string;
    facultad: string;
    escuela: string;
    plan: string;
  }>,
): Promise<AuthUser> {
  const response = await fetch(`${API_BASE}/students/${studentId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al actualizar el perfil');
  }
  const raw: StudentRead = await response.json();
  return mapStudentReadToAuthUser(raw);
}
