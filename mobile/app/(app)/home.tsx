import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Uniwind, useUniwind, useCSSVariable } from 'uniwind';
import { useAuth } from '../../context/AuthContext';
import { getStats } from '../../api/statsApi';
import type { DbStats } from '../../types/student';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatsCard from '../../components/ui/StatsCard';
import SafeAreaView from '../../components/ui/SafeAreaView';
import ThesisIdeaModal from '../../components/ui/ThesisIdeaModal';
import GpaEvolution from '../../components/home/GpaEvolution';
import CreditProgress from '../../components/home/CreditProgress';
import TopResearchAreas from '../../components/home/TopResearchAreas';
import TopThesisSubjects from '../../components/home/TopThesisSubjects';
import PublicationsByType from '../../components/home/PublicationsByType';
import { BarChart, PieChart } from 'react-native-gifted-charts';

// Dropdown theme selector 
function ThemeDropdown() {
	const { theme, hasAdaptiveThemes } = useUniwind();
	const activeTheme = hasAdaptiveThemes ? 'system' : theme;
	const [open, setOpen] = useState(false);

	const themeOptions = [
		{ mode: 'system', icon: 'monitor', label: 'Auto' },
		{ mode: 'light', icon: 'sun', label: 'Claro' },
		{ mode: 'dark', icon: 'moon', label: 'Oscuro' },
	] as const;

	const current = themeOptions.find(t => t.mode === activeTheme) ?? themeOptions[0];

	return (
		<View style={{ position: 'relative', zIndex: 50 }}>
			<Pressable
				onPress={() => setOpen(!open)}
				className="h-8 w-8 rounded-full border border-border bg-surface items-center justify-center"
			>
				<Feather name={current.icon as any} size={14} color="#8E8E9E" />
			</Pressable>
			{open && (
				<>
					{/* Backdrop */}
					<Pressable
						style={{ position: 'absolute', top: -200, left: -200, right: -200, bottom: -200, zIndex: 40 }}
						onPress={() => setOpen(false)}
					/>
					{/* Dropdown */}
					<View
						className="absolute right-0 top-10 bg-surface border border-border rounded-xl overflow-hidden shadow-lg"
						style={{ zIndex: 50, minWidth: 110 }}
					>
						{themeOptions.map(({ mode, icon, label }) => (
							<Pressable
								key={mode}
								onPress={() => { Uniwind.setTheme(mode); setOpen(false); }}
								className={[
									'flex-row items-center gap-2 px-3 py-2.5',
									activeTheme === mode ? 'bg-primary/10' : 'active:bg-surface-alt',
								].join(' ')}
							>
								<Feather name={icon as any} size={14} color={activeTheme === mode ? '#4F6D7A' : '#8E8E9E'} />
								<Text className={['text-xs font-medium', activeTheme === mode ? 'text-primary' : 'text-muted'].join(' ')}>
									{label}
								</Text>
							</Pressable>
						))}
					</View>
				</>
			)}
		</View>
	);
}

// DB Stats bar chart using gifted-charts 
function StatsBarChart({ stats, textColor }: { stats: DbStats; textColor: string }) {
	const barData = [
		{ value: stats.advisors, label: 'Profesores', frontColor: '#4F6D7A', topLabelComponent: () => <Text style={{ color: textColor, fontSize: 9, marginBottom: 2 }}>{stats.advisors.toLocaleString()}</Text> },
		{ value: stats.theses, label: 'Tesis', frontColor: '#5B8DEF', topLabelComponent: () => <Text style={{ color: textColor, fontSize: 9, marginBottom: 2 }}>{stats.theses.toLocaleString()}</Text> },
		{ value: stats.publications, label: 'Publicaciones', frontColor: '#3D8B5E', topLabelComponent: () => <Text style={{ color: textColor, fontSize: 9, marginBottom: 2 }}>{stats.publications.toLocaleString()}</Text> },
	];

	return (
		<View className="rounded-2xl border border-border bg-surface p-5">
			<Text className="text-sm font-semibold text-foreground mb-4">Datos por categoría</Text>
			<BarChart
				data={barData}
				height={140}
				barWidth={52}
				spacing={20}
				roundedTop
				hideRules={false}
				rulesColor={textColor + '25'}
				rulesType="dashed"
				yAxisTextStyle={{ color: textColor, fontSize: 10 }}
				xAxisLabelTextStyle={{ color: textColor, fontSize: 10 }}
				noOfSections={4}
				isAnimated
			/>
		</View>
	);
}

// Pie distribution using gifted-charts
function PieDistribution({ stats, textColor }: { stats: DbStats; textColor: string }) {
	const pieData = [
		{ value: stats.theses, color: '#5B8DEF', text: `Tesis (${Math.round(stats.theses / (stats.theses + stats.publications) * 100)}%)` },
		{ value: stats.publications, color: '#3D8B5E', text: `Publicaciones (${Math.round(stats.publications / (stats.theses + stats.publications) * 100)}%)` },
	];

	return (
		<View className="rounded-2xl border border-border bg-surface p-5">
			<Text className="text-sm font-semibold text-foreground mb-4">
				Distribución de producción académica
			</Text>
			<View className="flex-row items-center gap-5">
				<PieChart
					data={pieData}
					donut
					radius={60}
					innerRadius={38}
					centerLabelComponent={() => (
						<View className="items-center">
							<Text style={{ color: textColor, fontSize: 11, fontWeight: '700' }}>
								{(stats.theses + stats.publications).toLocaleString()}
							</Text>
							<Text style={{ color: textColor + '80', fontSize: 9 }}>total</Text>
						</View>
					)}
				/>
				<View className="gap-3">
					{pieData.map((d) => (
						<View key={d.text} className="flex-row items-center gap-2">
							<View className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
							<Text className="text-xs text-foreground">{d.text}</Text>
						</View>
					))}
				</View>
			</View>
		</View>
	);
}

// Main Screen 
export default function HomeScreen() {
	const { user } = useAuth();
	const [loading, setLoading] = useState(false);
	const [stats, setStats] = useState<DbStats | null>(null);
	const [viewMode, setViewMode] = useState<'normal' | 'dashboard'>('normal');
	const [showThesisModal, setShowThesisModal] = useState(!user?.thesis_idea);
	const textColor = (useCSSVariable('--color-foreground') as string | undefined) ?? '#1A1A2E';

	useEffect(() => {
		setLoading(true);
		getStats()
			.then(setStats)
			.catch(() => { })
			.finally(() => setLoading(false));
	}, []);

	// Show thesis modal every time the screen mounts if no thesis_idea
	useEffect(() => {
		if (!user?.thesis_idea) {
			setShowThesisModal(true);
		}
	}, []);

	if (!user) return null;

	const infoRows = [
		{ label: 'Código', value: user.estudiante.codigo_matricula, icon: 'award' as const },
		{ label: 'Facultad', value: user.estudiante.facultad, icon: 'book-open' as const },
		{ label: 'Programa', value: user.estudiante.escuela, icon: 'file-text' as const },
		{ label: 'Plan', value: user.estudiante.plan, icon: 'calendar' as const },
	];

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			{/* ThesisIdea Modal */}
			{showThesisModal && (
				<ThesisIdeaModal
					onClose={() => setShowThesisModal(false)}
					onSuccess={() => setShowThesisModal(false)}
				/>
			)}

			<ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40, gap: 20 }} showsVerticalScrollIndicator={false}>

				{/* Header */}
				<View className="flex-row items-center gap-3 mb-2">
					<View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
						<Feather name="user" size={22} color="#4F6D7A" />
					</View>
					<View className="flex-1">
						<Text className="text-base font-semibold text-foreground" numberOfLines={1}>
							{user.estudiante.nombres_apellidos}
						</Text>
						<Text className="text-xs text-muted">Estudiante FISI</Text>
					</View>
					{/* Dashboard toggle + Theme dropdown */}
					<View className="flex-row items-center gap-2">
						<Pressable
							onPress={() => setViewMode(viewMode === 'normal' ? 'dashboard' : 'normal')}
							className={[
								'flex-row items-center gap-1.5 h-8 px-3 rounded-full border',
								viewMode === 'dashboard' ? 'bg-primary border-primary' : 'bg-surface border-border',
							].join(' ')}
						>
							<Feather name="bar-chart-2" size={13} color={viewMode === 'dashboard' ? 'white' : '#8E8E9E'} />
							<Text className={['text-[10px] font-semibold', viewMode === 'dashboard' ? 'text-white' : 'text-muted'].join(' ')}>
								{viewMode === 'dashboard' ? 'Dashboard' : 'Dashboard'}
							</Text>
						</Pressable>
						<ThemeDropdown />
					</View>
				</View>

				{/* Thesis Idea Warning Banner */}
				{!user.thesis_idea && (
					<Pressable
						onPress={() => setShowThesisModal(true)}
						className="flex-row items-center justify-center gap-2 py-2 px-4 rounded-full border border-yellow-500/30 bg-yellow-500/10"
					>
						<View className="w-2 h-2 rounded-full bg-yellow-500" />
						<Text className="text-xs font-medium text-yellow-600">Insertar idea de tesis</Text>
					</Pressable>
				)}

				{/* NORMAL VIEW */}
				{viewMode === 'normal' && (
					<>
						{/* Profile Card */}
						<View className="rounded-2xl border border-border bg-surface p-5 gap-3">
							{infoRows.map(({ label, value, icon }) => (
								<View key={label} className="flex-row items-start gap-3">
									<Feather name={icon} size={14} color="#8E8E9E" style={{ marginTop: 2 }} />
									<View className="flex-1">
										<Text className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</Text>
										<Text className="text-sm text-foreground">{value || '—'}</Text>
									</View>
								</View>
							))}
							{/* GPA badge */}
							<View className="mt-2 rounded-xl bg-primary/5 px-4 py-3">
								<Text className="text-xs font-medium text-muted">Promedio Ponderado</Text>
								<Text className="text-2xl font-bold text-primary">
									{user.resumen_creditos.promedio_ponderado || '—'}
								</Text>
							</View>
						</View>

						{/* Stats Section */}
						<Text className="text-xs font-semibold uppercase tracking-wide text-muted">
							Cifras actuales de la fuente de datos
						</Text>

						{loading || !stats ? (
							<View className="h-32 rounded-2xl border border-border bg-surface items-center justify-center">
								<LoadingSpinner message="Cargando estadísticas..." />
							</View>
						) : (
							<>
								<View className="flex-row gap-3">
									<StatsCard value={stats.advisors.toLocaleString()} label="Profesores" icon={<Feather name="users" size={16} color="#4F6D7A" />} />
									<StatsCard value={stats.theses.toLocaleString()} label="Tesis" icon={<Feather name="book-open" size={16} color="#5B8DEF" />} />
								</View>
								<View className="flex-row gap-3">
									<StatsCard value={stats.publications.toLocaleString()} label="Publicaciones" icon={<Feather name="file-text" size={16} color="#3D8B5E" />} />
									<StatsCard value={`${stats.range_start}–${stats.range_end}`} label="Rango años" icon={<Feather name="calendar" size={16} color="#C4893D" />} />
								</View>
							</>
						)}
					</>
				)}

				{/* DASHBOARD VIEW */}
				{viewMode === 'dashboard' && (
					<>
						<Text className="text-xs font-semibold uppercase tracking-wide text-muted">
							Vista Dashboard
						</Text>

						{/* Credit progress (from student data) */}
						<CreditProgress credits={user.resumen_creditos} textColor={textColor} />

						{/* GPA evolution */}
						{user.periodos_academicos.length >= 2 && (
							<GpaEvolution
								periodos={user.periodos_academicos}
								promedioGlobal={user.resumen_creditos.promedio_ponderado}
								textColor={textColor}
							/>
						)}

						{/* DB Stats charts */}
						{loading || !stats ? (
							<View className="h-32 rounded-2xl border border-border bg-surface items-center justify-center">
								<LoadingSpinner message="Cargando estadísticas..." />
							</View>
						) : (
							<>
								<StatsBarChart stats={stats} textColor={textColor} />
								<PieDistribution stats={stats} textColor={textColor} />
							</>
						)}

						{/* Metadata charts */}
						<TopResearchAreas textColor={textColor} />
						<TopThesisSubjects />
						<PublicationsByType />
					</>
				)}

			</ScrollView>
		</SafeAreaView>
	);
}
