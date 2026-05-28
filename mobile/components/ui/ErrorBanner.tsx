import { View, Text } from 'react-native';

interface ErrorBannerProps {
  message: string;
}

export default function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <View className="rounded-xl bg-error-soft border border-error/30 px-4 py-3 mb-3">
      <Text className="text-sm text-error">{message}</Text>
    </View>
  );
}
