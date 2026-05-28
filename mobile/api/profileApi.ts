import { API_BASE } from './config';
import type { StudentProfile } from '../types/student';

export async function registerStudent(
  email: string,
  password: string,
  historial: { uri: string; name: string; type: string },
  matricula: { uri: string; name: string; type: string } | null,
  cv: { uri: string; name: string; type: string } | null,
): Promise<StudentProfile> {
  const formData = new FormData();
  formData.append('email', email);
  formData.append('password', password);
  // @ts-ignore — React Native FormData accepts blob-like objects
  formData.append('historial', { uri: historial.uri, name: historial.name, type: historial.type });
  if (matricula) {
    // @ts-ignore
    formData.append('matricula', { uri: matricula.uri, name: matricula.name, type: matricula.type });
  }
  if (cv) {
    // @ts-ignore
    formData.append('cv', { uri: cv.uri, name: cv.name, type: cv.type });
  }

  const response = await fetch(`${API_BASE}/process-profile`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || errorBody.error || 'Error al procesar el perfil');
  }

  return response.json();
}
