import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { metadataApi, type ThesisSubjectItem } from '../../api/metadataApi';

const COLORS = ['#5B8DEF', '#3D8B5E', '#C4893D', '#8B5CF6', '#C44545', '#4F6D7A', '#EC4899', '#06B6D4'];

export default function TopThesisSubjects() {
  const [subjects, setSubjects] = useState<ThesisSubjectItem[]>([]);

  useEffect(() => {
    metadataApi.getThesisSubjects()
      .then(data => setSubjects([...data].sort((a, b) => b.thesis_count - a.thesis_count).slice(0, 8)))
      .catch(() => {});
  }, []);

  if (!subjects.length) return null;

  const max = subjects[0]?.thesis_count || 1;

  return (
    <View className="rounded-2xl border border-border bg-surface p-5">
      <Text className="text-sm font-semibold text-foreground mb-4">
        Temas de Tesis Populares
      </Text>
      <View className="gap-2.5">
        {subjects.map((s, i) => (
          <View key={s.id} className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="text-xs text-foreground-secondary mb-1" numberOfLines={1}>{s.name}</Text>
              <View className="h-1.5 rounded-full bg-surface-alt overflow-hidden">
                <View
                  className="h-1.5 rounded-full"
                  style={{ width: `${(s.thesis_count / max) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}
                />
              </View>
            </View>
            <Text className="text-xs font-semibold text-foreground w-8 text-right shrink-0">
              {s.thesis_count}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
