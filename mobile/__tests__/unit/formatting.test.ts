import { formatDate, getTimeAgo, getScoreColor, formatAdvisorName } from '../../src/utils/formatting';

describe('formatDate', () => {
  it('formatea fecha ISO a DD/MM/YYYY', () => {
    expect(formatDate('2025-06-15T10:30:00Z')).toBe('15/06/2025');
  });

  it('formatea fecha con timestamp Unix', () => {
    const d = new Date(2025, 0, 5); // 5 Ene 2025
    expect(formatDate(d.toISOString())).toBe('05/01/2025');
  });

  it('retorna "—" para null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('retorna "—" para undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('retorna "—" para string inválido', () => {
    expect(formatDate('no-es-una-fecha')).toBe('—');
  });
});

describe('getTimeAgo', () => {
  it('retorna "Ahora" para fecha reciente', () => {
    expect(getTimeAgo(new Date().toISOString())).toBe('Ahora');
  });

  it('retorna "Hace Xm" para minutos', () => {
    const past = new Date(Date.now() - 5 * 60 * 1000);
    expect(getTimeAgo(past.toISOString())).toBe('Hace 5m');
  });

  it('retorna "Hace Xh" para horas', () => {
    const past = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(getTimeAgo(past.toISOString())).toBe('Hace 3h');
  });

  it('retorna "Hace Xd" para días', () => {
    const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(getTimeAgo(past.toISOString())).toBe('Hace 2d');
  });

  it('retorna "—" para null', () => {
    expect(getTimeAgo(null)).toBe('—');
  });
});

describe('getScoreColor', () => {
  it('retorna verde para score >= 75', () => {
    expect(getScoreColor(90)).toBe('#22C55E');
    expect(getScoreColor(75)).toBe('#22C55E');
  });

  it('retorna amarillo para score 50-74', () => {
    expect(getScoreColor(65)).toBe('#EAB308');
    expect(getScoreColor(50)).toBe('#EAB308');
  });

  it('retorna rojo para score < 50', () => {
    expect(getScoreColor(30)).toBe('#EF4444');
    expect(getScoreColor(0)).toBe('#EF4444');
  });

  it('retorna gris para null o undefined', () => {
    expect(getScoreColor(null)).toBe('#6B7280');
    expect(getScoreColor(undefined)).toBe('#6B7280');
  });
});

describe('formatAdvisorName', () => {
  it('retorna iniciales para nombre completo', () => {
    expect(formatAdvisorName('José María García López')).toBe('J.M.G.L.');
  });

  it('retorna iniciales solo de mayúsculas', () => {
    expect(formatAdvisorName('Carlos Andrés Nuñez')).toBe('C.A.N.');
  });

  it('retorna el nombre capitalizado si es una sola palabra', () => {
    expect(formatAdvisorName('zara')).toBe('Zara');
  });

  it('retorna "—" para null', () => {
    expect(formatAdvisorName(null)).toBe('—');
  });

  it('retorna "—" para undefined', () => {
    expect(formatAdvisorName(undefined)).toBe('—');
  });

  it('retorna "—" para string vacío', () => {
    expect(formatAdvisorName('')).toBe('—');
  });
});
