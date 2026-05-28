import { SafeAreaView as RNSafeAreaView, type SafeAreaViewProps } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

type AppSafeAreaViewProps = SafeAreaViewProps & { className?: string };

const BaseSafeAreaView = withUniwind(RNSafeAreaView);

export default function SafeAreaView({ edges = ['top'], className, ...props }: AppSafeAreaViewProps) {
  return <BaseSafeAreaView edges={edges} className={className} {...props} />;
}
