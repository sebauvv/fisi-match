import type { StudentProfile } from '../types/student';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Calls POST /process-profile with multipart form data
export async function registerStudent(
  email: string,
  password: string,
  historial: File,
  matricula: File | null,
  cv: File | null,
): Promise<StudentProfile> {
  const formData = new FormData();
  formData.append('email', email);
  formData.append('password', password);
  formData.append('historial', historial);

  if (matricula) {
    formData.append('matricula', matricula);
  }
  if (cv) {
    formData.append('cv', cv);
  }

  const response = await fetch(`${API_BASE}/process-profile`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || errorBody.error || 'Error al procesar el perfil';
    throw new Error(message);
  }

  return response.json();
}
