import { View, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import type { CreditsSummary } from '../../types/student';

interface Props {
  credits: CreditsSummary;
  textColor: string;
}

const ITEMS = [
  { key: 'obligatorios' as keyof CreditsSummary, label: 'Obligatorios', color: '#4F6D7A' },
  { key: 'de_especialidad' as keyof CreditsSummary, label: 'Especialidad', color: '#5B8DEF' },
  { key: 'electivos_generales' as keyof CreditsSummary, label: 'Electivos Gen.', color: '#3D8B5E' },
  { key: 'electivos_de_especialidad' as keyof CreditsSummary, label: 'Electivos Esp.', color: '#C4893D' },
  { key: 'optativos' as keyof CreditsSummary, label: 'Optativos', color: '#8B5CF6' },
];

export default function CreditProgress({ credits, textColor }: Props) {
  const total = credits.creditaje_requerido_para_egresar || 1;
  const approved = credits.creditaje_aprobado || 0;
  const pct = Math.min(Math.round((approved / total) * 100), 100);

  const pieData = ITEMS.map(item => ({
    value: (credits[item.key] as number) || 0,
    color: item.color,
    text: item.label,
  })).filter(d => d.value > 0);

  return (
    <View className="rounded-2xl border border-border bg-surface p-5">
      <Text className="text-sm font-semibold text-foreground mb-4">Progreso de Créditos</Text>
      <View className="flex-row items-center gap-4">
        {/* Donut */}
        <View className="items-center justify-center">
          <PieChart
            data={pieData.length > 0 ? pieData : [{ value: 1, color: '#E0E0E0' }]}
            donut
            radius={52}
            innerRadius={34}
            centerLabelComponent={() => (
              <View className="items-center">
                <Text className="text-lg font-black text-primary">{pct}%</Text>
                <Text className="text-[9px] text-muted">hecho</Text>
              </View>
            )}
          />
        </View>
        {/* Bars + legend */}
        <View className="flex-1 gap-2">
          {ITEMS.map(({ key, label, color }) => {
            const val = (credits[key] as number) || 0;
            const barPct = total > 0 ? Math.min((val / total) * 100, 100) : 0;
            return (
              <View key={key}>
                <View className="flex-row justify-between mb-0.5">
                  <Text style={{ color: textColor, fontSize: 10 }}>{label}</Text>
                  <Text style={{ color: textColor, fontSize: 10, fontWeight: '600' }}>{val}</Text>
                </View>
                <View className="h-1.5 rounded-full bg-surface-alt overflow-hidden">
                  <View className="h-1.5 rounded-full" style={{ width: `${barPct}%`, backgroundColor: color }} />
                </View>
              </View>
            );
          })}
          <Text className="text-[10px] text-muted mt-1">
            {approved} / {total} créditos
          </Text>
        </View>
      </View>
    </View>
  );
}
