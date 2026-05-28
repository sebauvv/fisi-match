import { API_BASE } from './config';
import type { DbStats } from '../types/student';

export async function getStats(): Promise<DbStats> {
  const response = await fetch(`${API_BASE}/stats`);
  if (!response.ok) throw new Error('Error al obtener estadisticas');
  return response.json();
}
