import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { metadataApi, type PublicationTypeItem } from '../../api/metadataApi';

const COLORS = ['#5B8DEF', '#3D8B5E', '#C4893D', '#8B5CF6', '#C44545', '#4F6D7A', '#EC4899'];

export default function PublicationsByType() {
  const [types, setTypes] = useState<PublicationTypeItem[]>([]);

  useEffect(() => {
    metadataApi.getPublicationTypes()
      .then(data => setTypes(data.filter(t => t.pub_count > 0).sort((a, b) => b.pub_count - a.pub_count)))
      .catch(() => {});
  }, []);

  if (!types.length) return null;

  const pieData = types.map(t => ({ name: t.label_es, value: t.pub_count }));

  return (
    <div className="rounded-2xl border border-border bg-bg-surface p-5 dark:border-dark-border dark:bg-dark-bg-surface">
      <h4 className="mb-4 text-sm font-semibold text-text-primary dark:text-dark-text-primary">
        Publicaciones por Tipo
      </h4>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
            paddingAngle={3} dataKey="value">
            {pieData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{
            background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
            borderRadius: '8px', fontSize: '12px',
          }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {pieData.slice(0, 5).map((e, i) => (
          <div key={e.name} className="flex items-center gap-1.5 text-[11px] text-text-secondary dark:text-dark-text-secondary">
            <div className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            {e.name}
          </div>
        ))}
      </div>
    </div>
  );
}
