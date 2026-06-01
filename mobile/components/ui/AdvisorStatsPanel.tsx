import { useMemo } from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import type { Advisor, Publication, Thesis } from '../../types/advisor';

const PUB_TYPE_MAP: Record<string, string> = {
  'journal-article': 'Artículo de Revista',
  'conference-paper': 'Artículo de Conf.',
  'book-chapter': 'Capítulo de Libro',
  'book': 'Libro',
  'preprint': 'Pre-impresión',
  'proceedings-article': 'Artículo de Actas',
  'report': 'Reporte',
};
const getPubLabel = (type: string | null) => type ? (PUB_TYPE_MAP[type] || 'Otro') : 'Otro';
const DONUT_COLORS = ['#5B8DEF', '#3D8B5E', '#C4893D', '#8B5CF6', '#C44545', '#4F6D7A', '#EC4899'];

interface Props {
  advisor: Advisor;
  publications: Publication[];
  theses: Thesis[];
  oldestYear: number | null;
}

export default function AdvisorStatsPanel({ advisor, publications, theses, oldestYear }: Props) {
  const isDark = useColorScheme() === 'dark';
  const textColor = isDark ? '#E4E4E7' : '#3F3F46'; // text-foreground-secondary
  
  // 1. Production by year
  const yearData = useMemo(() => {
    const map = new Map<number, { year: number; pubs: number; tesis: number }>();
    for (const p of publications) {
      if (!p.year) continue;
      const e = map.get(p.year) || { year: p.year, pubs: 0, tesis: 0 };
      e.pubs++;
      map.set(p.year, e);
    }
    for (const t of theses) {
      if (!t.year) continue;
      const e = map.get(t.year) || { year: t.year, pubs: 0, tesis: 0 };
      e.tesis++;
      map.set(t.year, e);
    }
    return Array.from(map.values()).sort((a, b) => a.year - b.year);
  }, [publications, theses]);

  // Convert for BarChart (stacked) - Gifted Charts stacked bar requires an array of stacks per bar
  const stackedYearData = useMemo(() => {
    return yearData.map(d => ({
      stacks: [
        { value: d.pubs, color: '#5B8DEF' },
        { value: d.tesis, color: '#3D8B5E', marginBottom: 2 }
      ],
      label: String(d.year)
    }));
  }, [yearData]);

  // 2. Publications by type
  const typeData = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of publications) {
      const label = getPubLabel(p.type);
      map.set(label, (map.get(label) || 0) + 1);
    }
    const arr = Array.from(map.entries())
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value);
    
    return arr.map((item, i) => ({
      ...item,
      color: DONUT_COLORS[i % DONUT_COLORS.length]
    }));
  }, [publications]);

  // 3. Degree level distribution
  const degreeData = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of theses) {
      const key = t.degree_name || t.degree_level || 'No especificado';
      map.set(key, (map.get(key) || 0) + 1);
    }
    const arr = Array.from(map.entries())
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value);
      
    return arr.map((item, i) => ({
      ...item,
      color: DONUT_COLORS[(i + 2) % DONUT_COLORS.length]
    }));
  }, [theses]);

  // 4. Top journals
  const journalData = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of publications) {
      if (!p.journal) continue;
      map.set(p.journal, (map.get(p.journal) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [publications]);

  const maxJournal = journalData[0]?.value || 1;

  return (
    <View className="gap-4 mb-6">
      {/* Stat cards */}
      <View className="flex-row gap-2">
        <View className="flex-1 bg-surface-alt border border-border rounded-xl p-4 items-center">
          <Text className="text-2xl font-bold font-serif text-accent mb-1">{advisor.external_publications_count}</Text>
          <Text className="text-[10px] text-muted text-center">Publicaciones</Text>
        </View>
        <View className="flex-1 bg-surface-alt border border-border rounded-xl p-4 items-center">
          <Text className="text-2xl font-bold font-serif text-emerald-500 mb-1">{advisor.thesis_count}</Text>
          <Text className="text-[10px] text-muted text-center">Tesis asesoradas</Text>
        </View>
        <View className="flex-1 bg-surface-alt border border-border rounded-xl p-4 items-center">
          <Text className="text-2xl font-bold font-serif text-warning mb-1">
            {oldestYear ? new Date().getFullYear() - oldestYear : '-'}
          </Text>
          <Text className="text-[10px] text-muted text-center">Años exp.</Text>
        </View>
      </View>

      {/* Production by Year */}
      {stackedYearData.length > 0 && (
        <View className="bg-surface-alt border border-border rounded-xl p-4">
          <Text className="text-sm font-semibold text-foreground mb-4">Producción por Año</Text>
          <View style={{ marginLeft: -10, overflow: 'hidden' }}>
            <BarChart
              stackData={stackedYearData}
              height={140}
              width={260}
              barWidth={18}
              noOfSections={4}
              yAxisTextStyle={{ color: textColor, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: textColor, fontSize: 9, width: 40 }}
              rulesColor={textColor + '30'}
              hideRules={false}
              isAnimated
            />
          </View>
          <View className="flex-row justify-center gap-4 mt-4">
            <View className="flex-row items-center gap-1.5">
              <View className="w-2 h-2 rounded-full bg-[#5B8DEF]" />
              <Text className="text-[11px] text-muted">Publicaciones</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="w-2 h-2 rounded-full bg-[#3D8B5E]" />
              <Text className="text-[11px] text-muted">Tesis</Text>
            </View>
          </View>
        </View>
      )}

      {/* Publications by Type */}
      {typeData.length > 0 && (
        <View className="bg-surface-alt border border-border rounded-xl p-4">
          <Text className="text-sm font-semibold text-foreground mb-4">Publicaciones por Tipo</Text>
          <View className="items-center">
            <PieChart
              data={typeData}
              donut
              radius={65}
              innerRadius={40}
            />
          </View>
          <View className="flex-row flex-wrap justify-center gap-x-3 gap-y-1.5 mt-4">
            {typeData.slice(0, 5).map((d, i) => (
              <View key={i} className="flex-row items-center gap-1.5">
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <Text className="text-[10px] text-muted">{d.text}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Degree Level */}
      {degreeData.length > 0 && (
        <View className="bg-surface-alt border border-border rounded-xl p-4">
          <Text className="text-sm font-semibold text-foreground mb-4">Nivel de Grado</Text>
          <View className="items-center">
            <PieChart
              data={degreeData}
              donut
              radius={65}
              innerRadius={0} // solid pie
            />
          </View>
          <View className="flex-row flex-wrap justify-center gap-x-3 gap-y-1.5 mt-4">
            {degreeData.map((d, i) => (
              <View key={i} className="flex-row items-center gap-1.5">
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <Text className="text-[10px] text-muted">{d.text} ({d.value})</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Top Journals */}
      {journalData.length > 0 && (
        <View className="bg-surface-alt border border-border rounded-xl p-4">
          <Text className="text-sm font-semibold text-foreground mb-4">Journals Frecuentes</Text>
          <View className="gap-3">
            {journalData.map((j, i) => (
              <View key={i}>
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-[10px] text-foreground-secondary flex-1 pr-2" numberOfLines={1}>{j.name}</Text>
                  <Text className="text-[10px] font-semibold text-foreground">{j.value}</Text>
                </View>
                <View className="h-1.5 rounded-full bg-surface w-full overflow-hidden">
                  <View 
                    className="h-full rounded-full" 
                    style={{ width: `${(j.value / maxJournal) * 100}%`, backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} 
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
