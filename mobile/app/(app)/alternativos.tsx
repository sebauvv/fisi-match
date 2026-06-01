import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { alignmentApi } from '../../api/alignmentApi';
import { alternativeApi } from '../../api/alternativeApi';
import type { AlignmentReport } from '../../types/alignment';
import type { AlternativeRecommendationResponse } from '../../types/alternative';
import ErrorBanner from '../../components/ui/ErrorBanner';
import Button from '../../components/ui/Button';
import SafeAreaView from '../../components/ui/SafeAreaView';
import ThesisIdeaModal from '../../components/ui/ThesisIdeaModal';

function ReportItem({ report, isActive, onPress }: { report: AlignmentReport; isActive: boolean; onPress: () => void }) {
	return (
		<Pressable
			onPress={onPress}
			className={['rounded-xl border p-3 mb-2', isActive ? 'border-primary bg-primary-soft' : 'border-border bg-surface'].join(' ')}
		>
			<Text className="text-xs font-semibold text-foreground" numberOfLines={2}>{report.thesis_idea}</Text>
			<Text className="text-[10px] text-muted mt-1">{report.alignment_level} · {new Date(report.created_at).toLocaleDateString('es-PE')}</Text>
		</Pressable>
	);
}

export default function AlternativosScreen() {
	const { user, token } = useAuth();
	const studentId = user?.student_id;
	const [alignmentReports, setAlignmentReports] = useState<AlignmentReport[]>([]);
	const [activeReportId, setActiveReportId] = useState<string | null>(null);
	const [alternativeData, setAlternativeData] = useState<Record<string, AlternativeRecommendationResponse>>({});
	const [isLoading, setIsLoading] = useState(true);
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showSidebar, setShowSidebar] = useState(false);
	const [showThesisModal, setShowThesisModal] = useState(false);

	useEffect(() => {
		if (!studentId || !token) return;
		setIsLoading(true);
		alignmentApi.getAlignmentReports(studentId, token)
			.then((data) => setAlignmentReports(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())))
			.catch((e) => setError(e.message))
			.finally(() => setIsLoading(false));
	}, [studentId, token]);

	// Guard: no thesis idea
	if (!user?.thesis_idea) {
		return (
			<SafeAreaView className="flex-1 bg-background" edges={['top']}>
				{showThesisModal && (
					<ThesisIdeaModal
						onClose={() => setShowThesisModal(false)}
						onSuccess={() => setShowThesisModal(false)}
					/>
				)}
				<View className="flex-1 items-center justify-center px-8 gap-5">
					<View className="w-16 h-16 rounded-full bg-yellow-500/10 items-center justify-center">
						<Feather name="lock" size={28} color="#C4893D" />
					</View>
					<Text className="text-xl font-bold text-foreground text-center">Idea de tesis requerida</Text>
					<Text className="text-sm text-muted text-center leading-5">
						Para ver recomendaciones alternativas necesitas primero registrar tu idea de tesis.
					</Text>
					<Pressable
						onPress={() => setShowThesisModal(true)}
						className="flex-row items-center gap-2 py-3 px-6 rounded-full bg-primary"
					>
						<Feather name="book-open" size={16} color="white" />
						<Text className="text-sm font-semibold text-white">Insertar idea de tesis</Text>
					</Pressable>
				</View>
			</SafeAreaView>
		);
	}

	const handleGenerate = async (id: string) => {
		if (!studentId || !token || alternativeData[id]) return;
		setIsGenerating(true);
		setError(null);
		try {
			const data = await alternativeApi.generateAlternativeRecommendations(studentId, id, token);
			setAlternativeData((prev) => ({ ...prev, [id]: data }));
		} catch (e: any) {
			setError(e.message || 'Error al generar recomendaciones');
		} finally {
			setIsGenerating(false);
		}
	};

	const activeReport = alignmentReports.find((r) => r.id === activeReportId);
	const activeData = activeReportId ? alternativeData[activeReportId] : null;

	const renderContent = () => {
		if (isLoading) {
			return (
				<View className="flex-1 items-center justify-center gap-3">
					<ActivityIndicator colorClassName="accent-primary" size="large" />
					<Text className="text-sm text-muted">Cargando reportes...</Text>
				</View>
			);
		}
		if (!activeReportId || !activeReport) {
			return (
				<View className="flex-1 items-center justify-center gap-3 px-6">
					<View className="w-14 h-14 rounded-2xl bg-success/10 items-center justify-center">
						<Text className="text-2xl">🎯</Text>
					</View>
					<Text className="text-base font-semibold text-foreground text-center">Selecciona un análisis</Text>
					<Text className="text-sm text-muted text-center">
						Elige un reporte de alineamiento para ver las recomendaciones de temas alternativos.
					</Text>
					<Button title="Ver reportes" onPress={() => setShowSidebar(true)} variant="outline" />
				</View>
			);
		}
		if (!activeData) {
			return (
				<View className="flex-1 items-center justify-center gap-4 px-6">
					<View className="rounded-2xl border border-border bg-surface p-5 w-full">
						<Text className="text-xs text-muted uppercase tracking-wide mb-2">Idea seleccionada</Text>
						<Text className="text-sm italic text-foreground">&ldquo;{activeReport.thesis_idea}&rdquo;</Text>
					</View>
					<Button
						title="Generar Recomendaciones"
						onPress={() => handleGenerate(activeReportId)}
						loading={isGenerating}
						disabled={isGenerating}
					/>
				</View>
			);
		}
		return (
			<ScrollView contentContainerClassName="pb-8 gap-4" showsVerticalScrollIndicator={false}>
				{/* Summary */}
				<View className="rounded-2xl border border-border bg-surface p-5">
					<Text className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Resumen</Text>
					<Text className="text-sm text-foreground leading-5">{activeData.summary}</Text>
				</View>

				{/* Alternative topics */}
				{activeData.alternative_topics.length > 0 && (
					<View className="rounded-2xl border border-border bg-surface p-5">
						<Text className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Temas Alternativos</Text>
						{activeData.alternative_topics.map((topic, i) => (
							<View key={i} className="mb-4 pb-4 border-b border-border/50 last:border-0 last:mb-0 last:pb-0">
								<Text className="text-sm font-semibold text-foreground mb-1">{topic.title}</Text>
								<Text className="text-xs text-muted leading-4 mb-1">{topic.justification}</Text>
								<View className="flex-row items-center gap-1.5">
									<Feather name="git-branch" size={11} color="#4F6D7A" />
									<Text className="text-[11px] text-primary">{topic.delta_from_current}</Text>
								</View>
							</View>
						))}
					</View>
				)}

				{/* Skill gaps */}
				{activeData.skill_gaps_to_close.length > 0 && (
					<View className="rounded-2xl border border-border bg-surface p-5">
						<Text className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Brechas a Cerrar</Text>
						{activeData.skill_gaps_to_close.map((g, i) => (
							<View key={i} className="mb-3">
								<Text className="text-sm font-semibold text-foreground">{g.skill}</Text>
								<Text className="text-xs text-muted">{g.resource} · {g.estimated_time}</Text>
							</View>
						))}
					</View>
				)}

				{/* Courses */}
				{activeData.recommended_courses.length > 0 && (
					<View className="rounded-2xl border border-border bg-surface p-5">
						<Text className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Cursos Recomendados</Text>
						{activeData.recommended_courses.map((c, i) => (
							<View key={i} className="mb-3">
								<Text className="text-sm font-semibold text-foreground">{c.name}</Text>
								<Text className="text-xs text-muted">{c.platform}</Text>
								<Text className="text-xs text-foreground-secondary mt-0.5">{c.reason}</Text>
							</View>
						))}
					</View>
				)}

				{/* Mini projects */}
				{activeData.mini_projects.length > 0 && (
					<View className="rounded-2xl border border-border bg-surface p-5">
						<Text className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Mini Proyectos</Text>
						{activeData.mini_projects.map((p, i) => (
							<View key={i} className="mb-3">
								<Text className="text-sm font-semibold text-foreground">{p.title}</Text>
								<Text className="text-xs text-muted leading-4">{p.description}</Text>
								<View className="flex-row flex-wrap gap-1 mt-1">
									{p.skills_covered.map((s) => (
										<View key={s} className="bg-primary-soft rounded px-1.5 py-0.5">
											<Text className="text-[10px] text-primary">{s}</Text>
										</View>
									))}
								</View>
							</View>
						))}
					</View>
				)}
			</ScrollView>
		);
	};

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			{/* Generate modal */}
			<Modal visible={isGenerating} transparent animationType="fade">
				<View className="flex-1 bg-black/60 items-center justify-center px-6">
					<View className="bg-surface rounded-2xl p-8 items-center gap-4">
						<ActivityIndicator colorClassName="accent-primary" size="large" />
						<Text className="text-base font-semibold text-foreground">Generando alternativas...</Text>
					</View>
				</View>
			</Modal>

			{/* History sidebar */}
			<Modal visible={showSidebar} transparent animationType="slide" onRequestClose={() => setShowSidebar(false)}>
				<Pressable className="flex-1 bg-black/40" onPress={() => setShowSidebar(false)} />
				<View className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl p-5" style={{ maxHeight: '70%' }}>
					<View className="flex-row items-center justify-between mb-4">
						<Text className="text-base font-bold text-foreground">Análisis de Alineamiento</Text>
						<Pressable onPress={() => setShowSidebar(false)}>
							<Feather name="x" size={20} color="#8E8E9E" />
						</Pressable>
					</View>
					<FlatList
						data={alignmentReports}
						keyExtractor={(r) => r.id}
						renderItem={({ item }) => (
							<ReportItem
								report={item}
								isActive={item.id === activeReportId}
								onPress={() => { setActiveReportId(item.id); setShowSidebar(false); }}
							/>
						)}
						ListEmptyComponent={<Text className="text-sm text-muted text-center py-4">No hay reportes de alineamiento</Text>}
					/>
				</View>
			</Modal>

			<View className="flex-1 px-4 py-4">
				{/* Header */}
				<View className="flex-row items-center justify-between mb-4">
					<Text className="text-xl font-bold text-foreground">Temas Alternativos</Text>
					<Pressable onPress={() => setShowSidebar(true)} className="flex-row items-center gap-1">
						<Feather name="clock" size={14} color="#4F6D7A" />
						<Text className="text-xs text-primary font-semibold">Análisis ({alignmentReports.length})</Text>
					</Pressable>
				</View>

				{error ? <ErrorBanner message={error} /> : null}

				{renderContent()}
			</View>
		</SafeAreaView>
	);
}
