import type { AcademicPeriod, CreditsSummary } from '../../types/student';

export function calcAvg(cursos: AcademicPeriod['cursos']): number | null {
  let sumWt = 0, sumCred = 0;
  for (const c of cursos) {
    const cal = parseFloat(c.calificacion);
    const cred = parseFloat(c.creditos);
    if (!isNaN(cal) && !isNaN(cred) && cred > 0) {
      sumWt += cal * cred;
      sumCred += cred;
    }
  }
  return sumCred > 0 ? Math.round((sumWt / sumCred) * 100) / 100 : null;
}

export function calcCreditProgress(approved: number, required: number): number {
  if (required <= 0) return 0;
  return Math.min(Math.round((approved / required) * 100), 100);
}

export function calcRemainingCredits(
  required: number | null | undefined,
  approved: number | null | undefined,
): number {
  const req = required ?? 0;
  const app = approved ?? 0;
  return Math.max(req - app, 0);
}

export function calcCategoryBarPct(categoryValue: number, totalRequired: number): number {
  if (totalRequired <= 0) return 0;
  return Math.min((categoryValue / totalRequired) * 100, 100);
}
