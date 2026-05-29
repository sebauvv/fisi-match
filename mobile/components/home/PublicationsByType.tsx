import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
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

  const pieData = types.slice(0, 7).map((t, i) => ({
    value: t.pub_count,
    color: COLORS[i % COLORS.length],
    text: t.label_es,
  }));

  const total = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <View className="rounded-2xl border border-border bg-surface p-5">
      <Text className="text-sm font-semibold text-foreground mb-4">
        Publicaciones por Tipo
      </Text>
      <View className="items-center mb-4">
        <PieChart
          data={pieData}
          donut
          radius={70}
          innerRadius={44}
          centerLabelComponent={() => (
            <View className="items-center">
              <Text className="text-sm font-black text-foreground">{total.toLocaleString()}</Text>
              <Text className="text-[9px] text-muted">total</Text>
            </View>
          )}
        />
      </View>
      {/* Legend */}
      <View className="flex-row flex-wrap gap-x-4 gap-y-1.5 justify-center">
        {pieData.map((d, i) => (
          <View key={i} className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            <Text className="text-[11px] text-foreground-secondary">{d.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
