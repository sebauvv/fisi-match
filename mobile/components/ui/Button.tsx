import { Pressable, Text, ActivityIndicator } from 'react-native';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'outline' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const variantClasses: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: 'bg-primary rounded-xl py-4 items-center justify-center flex-row gap-2',
    text: 'text-white font-semibold text-base',
  },
  outline: {
    container: 'border border-border rounded-xl py-3.5 items-center justify-center flex-row gap-2',
    text: 'text-muted font-medium text-sm',
  },
  ghost: {
    container: 'rounded-xl py-3 items-center justify-center flex-row gap-2',
    text: 'text-foreground-secondary font-medium text-sm',
  },
};

export default function Button({ title, onPress, variant = 'primary', disabled, loading, className }: ButtonProps) {
  const v = variantClasses[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(v.container, (disabled || loading) && 'opacity-60', className)}
    >
      {loading && (
        <ActivityIndicator
          colorClassName={variant === 'primary' ? 'accent-white' : 'accent-primary'}
          size="small"
        />
      )}
      <Text className={v.text}>{title}</Text>
    </Pressable>
  );
}
