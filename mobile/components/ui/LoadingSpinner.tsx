import { View, Text, ActivityIndicator } from 'react-native';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3">
      <ActivityIndicator colorClassName="accent-primary" size="large" />
      {message && <Text className="text-sm text-muted">{message}</Text>}
    </View>
  );
}
