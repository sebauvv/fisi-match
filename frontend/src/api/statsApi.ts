import type { DbStats } from '../types/student';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function getStats(): Promise<DbStats> {
  const response = await fetch(`${API_BASE}/stats`);

  if (!response.ok) {
    throw new Error('Error al obtener estadisticas');
  }

  return response.json();
}
