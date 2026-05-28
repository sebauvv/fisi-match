import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { AcademicPeriod } from '../../types/student';

interface Props {
  periodos: AcademicPeriod[];
  promedioGlobal: number;
}

function calcAvg(cursos: AcademicPeriod['cursos']): number | null {
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

export default function GpaEvolution({ periodos, promedioGlobal }: Props) {
  const data = periodos
    .map(p => ({ name: p.periodo, promedio: calcAvg(p.cursos) }))
    .filter(d => d.promedio !== null);

  if (data.length < 2) return null;

  return (
    <div className="rounded-2xl border border-border bg-bg-surface p-5 dark:border-dark-border dark:bg-dark-bg-surface">
      <h4 className="mb-4 text-sm font-semibold text-text-primary dark:text-dark-text-primary">
        Evolución del Promedio por Periodo
      </h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8E8E9E' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 20]} tick={{ fontSize: 10, fill: '#8E8E9E' }} axisLine={false} tickLine={false} width={28} />
          <Tooltip contentStyle={{
            background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
            borderRadius: '8px', fontSize: '12px',
          }} />
          <ReferenceLine y={promedioGlobal} stroke="#C4893D" strokeDasharray="6 3"
            label={{ value: `Prom: ${promedioGlobal}`, position: 'right', fontSize: 10, fill: '#C4893D' }} />
          <Line type="monotone" dataKey="promedio" stroke="#5B8DEF" strokeWidth={2}
            dot={{ r: 3, fill: '#5B8DEF' }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
