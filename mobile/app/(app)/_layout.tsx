import { Tabs, Redirect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useCSSVariable } from 'uniwind';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function AppLayout() {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) return <LoadingSpinner />;
	if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

	const background = useCSSVariable('--color-background') as string | undefined;
	const surface = useCSSVariable('--color-surface') as string | undefined;
	const border = useCSSVariable('--color-border') as string | undefined;
	const primary = useCSSVariable('--color-primary') as string | undefined;
	const muted = useCSSVariable('--color-muted') as string | undefined;

	const tabBarStyle = useMemo(
		() => ({
			backgroundColor: surface ?? 'transparent',
			borderTopColor: border ?? 'transparent',
			borderTopWidth: 1,
			elevation: 0,
		}),
		[surface, border]
	);

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				sceneStyle: { backgroundColor: background ?? 'transparent' },
				tabBarStyle,
				tabBarActiveTintColor: primary ?? '#5B8DEF',
				tabBarInactiveTintColor: muted ?? '#64748B',
				tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
			}}
		>
			<Tabs.Screen
				name="home"
				options={{
					title: 'Inicio',
					tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="explorador"
				options={{
					title: 'Explorador',
					tabBarIcon: ({ color, size }) => <Feather name="search" size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="recomendacion"
				options={{
					title: 'Asesor',
					tabBarIcon: ({ color, size }) => <Feather name="compass" size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="alineamiento"
				options={{
					title: 'Alineamiento',
					tabBarIcon: ({ color, size }) => <Feather name="clipboard" size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="alternativos"
				options={{
					title: 'Alternativas',
					tabBarIcon: ({ color, size }) => <Feather name="bell" size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="perfil"
				options={{
					title: 'Perfil',
					tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
				}}
			/>
		</Tabs>
	);
}
