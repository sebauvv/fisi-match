import { View, Text, TextInput } from 'react-native';
import { cn } from '../../lib/cn';

interface TextInputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  className?: string;
}

export default function TextInputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = 'none',
  keyboardType = 'default',
  className,
}: TextInputFieldProps) {
  return (
    <View className={cn('gap-1.5', className)}>
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        className="w-full rounded-xl border border-border bg-background py-3 px-4 text-sm text-foreground focus:border-primary"
        placeholderTextColorClassName="accent-muted"
        selectionColorClassName="accent-primary"
        cursorColorClassName="accent-primary"
        underlineColorAndroidClassName="accent-transparent"
      />
    </View>
  );
}
