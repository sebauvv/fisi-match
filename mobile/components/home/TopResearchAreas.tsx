import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { metadataApi, type ResearchAreaItem } from '../../api/metadataApi';

interface Props {
  textColor: string;
}

const COLORS = ['#4F6D7A', '#5B8DEF', '#3D8B5E', '#C4893D', '#8B5CF6', '#C44545', '#4F6D7A', '#EC4899'];

export default function TopResearchAreas({ textColor }: Props) {
  const [areas, setAreas] = useState<ResearchAreaItem[]>([]);

  useEffect(() => {
    metadataApi.getResearchAreas()
      .then(data => {
        setAreas([...data].sort((a, b) => b.advisor_count - a.advisor_count).slice(0, 6));
      })
      .catch(() => {});
  }, []);

  if (!areas.length) return null;

  return (
    <View className="rounded-2xl border border-border bg-surface p-5">
      <Text className="text-sm font-semibold text-foreground mb-4">
        Top Áreas de Investigación
      </Text>
      <View className="gap-2.5">
        {areas.map((area, i) => {
          const max = areas[0]?.advisor_count || 1;
          const pct = (area.advisor_count / max) * 100;
          return (
            <View key={area.id} className="flex-row items-center gap-3">
              <View className="flex-1">
                <Text className="text-xs text-foreground-secondary mb-1" numberOfLines={1}>
                  {area.name}
                </Text>
                <View className="h-1.5 rounded-full bg-surface-alt overflow-hidden">
                  <View
                    className="h-1.5 rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                  />
                </View>
              </View>
              <Text className="text-xs font-semibold text-foreground w-8 text-right shrink-0">
                {area.advisor_count}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
