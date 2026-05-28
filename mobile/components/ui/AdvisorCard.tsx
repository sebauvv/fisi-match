import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Advisor } from '../../types/advisor';

interface AdvisorCardProps {
  advisor: Advisor;
  onPress: (advisor: Advisor) => void;
}

export default function AdvisorCard({ advisor, onPress }: AdvisorCardProps) {
  return (
    <Pressable
      onPress={() => onPress(advisor)}
      className="flex-row items-center justify-between py-3.5 px-4 rounded-xl border border-border bg-surface mb-2 active:opacity-75"
    >
      <View className="flex-1 mr-3">
        <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
          {advisor.full_name}
        </Text>
        {advisor.research_areas.length > 0 && (
          <Text className="text-xs text-muted mt-0.5" numberOfLines={1}>
            {advisor.research_areas.slice(0, 2).join(' · ')}
          </Text>
        )}
        <View className="flex-row items-center gap-3 mt-1">
          <Text className="text-[10px] text-muted">
            {advisor.thesis_count} tesis · {advisor.external_publications_count} publicaciones
          </Text>
          {advisor.orcid && (
            <View className="bg-primary-soft rounded px-1.5 py-0.5">
              <Text className="text-[9px] font-bold text-primary">ORCID</Text>
            </View>
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={16} color="#8E8E9E" />
    </Pressable>
  );
}
