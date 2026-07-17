import { calcAvg, calcCreditProgress, calcRemainingCredits, calcCategoryBarPct } from '../../src/utils/calculation';
import type { AcademicPeriod } from '../../types/student';

describe('calcAvg', () => {
  it('calcula GPA ponderado correctamente con cursos normales', () => {
    const cursos = [
      { calificacion: '18', creditos: '4' },
      { calificacion: '14', creditos: '3' },
    ];
    // (18*4 + 14*3) / (4+3) = (72+42)/7 = 114/7 = 16.2857 → 16.29
    expect(calcAvg(cursos as AcademicPeriod['cursos'])).toBe(16.29);
  });

  it('retorna null si no hay cursos con créditos > 0', () => {
    const cursos = [
      { calificacion: '18', creditos: '0' },
      { calificacion: '14', creditos: '0' },
    ];
    expect(calcAvg(cursos as AcademicPeriod['cursos'])).toBeNull();
  });

  it('retorna null para array vacío', () => {
    expect(calcAvg([])).toBeNull();
  });

  it('ignora NaN en calificación y créditos', () => {
    const cursos = [
      { calificacion: 'ABC', creditos: '4' },
      { calificacion: '16', creditos: '3' },
    ];
    // Solo toma el segundo: 16*3 / 3 = 16
    expect(calcAvg(cursos as AcademicPeriod['cursos'])).toBe(16);
  });

  it('ignora cursos con creditos string inválido', () => {
    const cursos = [
      { calificacion: '15', creditos: 'XYZ' },
      { calificacion: '10', creditos: '5' },
    ];
    // 10*5 / 5 = 10
    expect(calcAvg(cursos as AcademicPeriod['cursos'])).toBe(10);
  });

  it('calcula correctamente redondeando a 2 decimales', () => {
    const cursos = [
      { calificacion: '10', creditos: '3' },
      { calificacion: '11', creditos: '3' },
    ];
    // (30 + 33) / 6 = 63/6 = 10.5
    expect(calcAvg(cursos as AcademicPeriod['cursos'])).toBe(10.5);
  });
});

describe('calcCreditProgress', () => {
  it('calcula porcentaje normal (50/200 = 25%)', () => {
    expect(calcCreditProgress(50, 200)).toBe(25);
  });

  it('retorna 0 si required es 0', () => {
    expect(calcCreditProgress(50, 0)).toBe(0);
  });

  it('retorna 0 si required es negativo', () => {
    expect(calcCreditProgress(10, -1)).toBe(0);
  });

  it('retorna 0 si approved es 0', () => {
    expect(calcCreditProgress(0, 200)).toBe(0);
  });

  it('cappeda al 100% si approved > required', () => {
    expect(calcCreditProgress(250, 200)).toBe(100);
  });
});

describe('calcRemainingCredits', () => {
  it('calcula créditos faltantes normales (200 - 150 = 50)', () => {
    expect(calcRemainingCredits(200, 150)).toBe(50);
  });

  it('retorna 0 si ya egresó (200 - 200 = 0)', () => {
    expect(calcRemainingCredits(200, 200)).toBe(0);
  });

  it('trata null como 0 para required', () => {
    expect(calcRemainingCredits(null, 10)).toBe(0);
  });

  it('trata undefined como 0 para approved', () => {
    expect(calcRemainingCredits(100, undefined)).toBe(100);
  });

  it('retorna 0 si ambos son null', () => {
    expect(calcRemainingCredits(null, null)).toBe(0);
  });
});

describe('calcCategoryBarPct', () => {
  it('calcula porcentaje normal (30/200 = 15%)', () => {
    expect(calcCategoryBarPct(30, 200)).toBe(15);
  });

  it('retorna 0 si totalRequired es 0', () => {
    expect(calcCategoryBarPct(30, 0)).toBe(0);
  });

  it('cappeda al 100% si valor es mayor al total', () => {
    expect(calcCategoryBarPct(300, 200)).toBe(100);
  });

  it('retorna 0 si categoría es 0', () => {
    expect(calcCategoryBarPct(0, 200)).toBe(0);
  });
});
