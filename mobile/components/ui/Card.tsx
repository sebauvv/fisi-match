import { View } from 'react-native';
import { cn } from '../../lib/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className }: CardProps) {
  return (
    <View className={cn('rounded-2xl border border-border bg-surface p-5', className)}>
      {children}
    </View>
  );
}
