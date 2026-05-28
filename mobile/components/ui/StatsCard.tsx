import { View, Text } from 'react-native';
import type { ReactNode } from 'react';

interface StatsCardProps {
  value: string | number;
  label: string;
  icon: ReactNode;
}

export default function StatsCard({ value, label, icon }: StatsCardProps) {
  return (
    <View className="flex-1 rounded-xl border border-border bg-surface p-4">
      <View className="mb-2">{icon}</View>
      <Text className="text-xl font-bold text-foreground">{value}</Text>
      <Text className="text-xs text-muted">{label}</Text>
    </View>
  );
}
