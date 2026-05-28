import { API_BASE, authHeaders } from './config';
import type { AlignmentReport } from '../types/alignment';

export const alignmentApi = {
  async getAlignmentReports(studentId: string, token: string): Promise<AlignmentReport[]> {
    const response = await fetch(`${API_BASE}/students/${studentId}/alignment`, {
      headers: authHeaders(token),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al obtener reportes de alineamiento');
    }
    return response.json();
  },

  async generateAlignmentReport(studentId: string, token: string): Promise<AlignmentReport> {
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
