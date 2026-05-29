import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function AuthLayout() {
  const { isAuthenticated, isLoading, skipAuthRedirect } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (isAuthenticated && !skipAuthRedirect) return <Redirect href="/(app)/home" />;


  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
