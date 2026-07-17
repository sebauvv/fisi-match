export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const now = Date.now();
  const diffMs = now - d.getTime();
  if (diffMs < 0) return 'Ahora';
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `Hace ${diffD}d`;
  const diffM = Math.floor(diffD / 30);
  if (diffM < 12) return `Hace ${diffM}mes`;
  return `Hace ${Math.floor(diffM / 12)}a`;
}

export function getScoreColor(score: number | null | undefined): string {
  if (score == null) return '#6B7280';
  if (score >= 75) return '#22C55E';
  if (score >= 50) return '#EAB308';
  return '#EF4444';
}

export function formatAdvisorName(name: string | null | undefined): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  const initials = parts
    .filter((p) => p.length > 0 && p[0] === p[0].toUpperCase())
    .map((p) => p.charAt(0) + '.')
    .join('');
  return initials;
}
