import type { AlignmentReport } from '../types/alignment';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export const alignmentApi = {
  getAlignmentReports: async (studentId: string, token: string): Promise<AlignmentReport[]> => {
    const response = await fetch(`${API_BASE}/students/${studentId}/alignment`, {
      method: 'GET',
      headers: authHeaders(token),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al obtener reportes de alineamiento');
    }
    return response.json();
  },

  generateAlignmentReport: async (studentId: string, token: string): Promise<AlignmentReport> => {
    const response = await fetch(`${API_BASE}/students/${studentId}/alignment`, {
      method: 'POST',
      headers: authHeaders(token),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al generar reporte de alineamiento');
    }
    return response.json();
  },
};
