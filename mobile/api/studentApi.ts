import { API_BASE, authHeaders } from './config';
import type { AuthUser } from '../types/student';

export async function getStudent(studentId: string, token: string): Promise<AuthUser> {
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
  data: Partial<{ thesis_idea: string; cv_text: string }>,
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
