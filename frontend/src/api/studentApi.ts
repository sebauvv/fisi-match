const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface StudentUpdatePayload {
  nombres_apellidos?: string;
  codigo_matricula?: string;
  facultad?: string;
  escuela?: string;
  plan?: string;
  cv_text?: string;
}

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function getStudent(studentId: string, token: string) {
  const response = await fetch(`${API_BASE}/students/${studentId}`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al obtener el perfil');
  }

  return response.json();
}

export async function updateStudent(
  studentId: string,
  token: string,
  data: StudentUpdatePayload,
) {
  const response = await fetch(`${API_BASE}/students/${studentId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al actualizar el perfil');
  }

  return response.json();
}
