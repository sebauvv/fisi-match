import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../../context/AuthContext';
import { updateStudent } from '../../api/studentApi';
import { router } from 'expo-router';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SafeAreaView from '../../components/ui/SafeAreaView';
import CoursesModal from '../../components/ui/CoursesModal';
import ThesisIdeaModal from '../../components/ui/ThesisIdeaModal';

// Info row
function InfoRow({ label, value, icon }: { label: string; value: string; icon: React.ComponentProps<typeof Feather>['name'] }) {
	return (
		<View className="flex-row items-start gap-3 py-2 border-b border-border/40">
			<Feather name={icon} size={14} color="#8E8E9E" style={{ marginTop: 2 }} />
			<View className="flex-1">
				<Text className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</Text>
				<Text className="text-sm text-foreground">{value || '—'}</Text>
			</View>
		</View>
	);
}

// PDF button 
function PdfButton({ label, url, onPress }: { label: string; url?: string; onPress: () => void }) {
	return (
		<Pressable
			onPress={onPress}
			disabled={!url}
			className={['flex-row items-center justify-between py-3 px-4 rounded-xl border border-border bg-background', !url ? 'opacity-40' : 'active:bg-surface-alt'].join(' ')}
		>
			<View className="flex-row items-center gap-2">
				<Feather name="file-text" size={15} color="#4F6D7A" />
				<Text className="text-sm text-foreground">{label}</Text>
			</View>
			<Feather name="external-link" size={14} color="#8E8E9E" />
		</Pressable>
	);
}

// CV Parser 
// Parses the structured text format from prompt.txt:
// Section Header:\n- Item: detail\n- Item: detail\n
type CvSection = { header: string; items: string[] };

function parseCvText(text: string): CvSection[] {
	const sections: CvSection[] = [];
	const lines = text.split('\n');
	let current: CvSection | null = null;

	for (const raw of lines) {
		const line = raw.trim();
		if (!line) continue;

		// Section header lines end with ":"
		if (!line.startsWith('-') && line.endsWith(':')) {
			if (current) sections.push(current);
			current = { header: line.slice(0, -1), items: [] };
		} else if (line.startsWith('- ') && current) {
			current.items.push(line.slice(2));
		} else if (current && current.items.length > 0) {
			// continuation of last item (no dash)
			current.items[current.items.length - 1] += ' ' + line;
		}
	}
	if (current) sections.push(current);
	return sections;
}

function CvDisplay({ cvText }: { cvText: string }) {
	const sections = parseCvText(cvText);
	if (!sections.length) {
		return (
			<Text className="text-sm text-muted">
				{cvText || 'No se encontraron habilidades. Sube tu CV al registrarte.'}
			</Text>
		);
	}
	return (
		<View className="gap-4">
			{sections.map((section) => (
				<View key={section.header}>
					<Text className="text-xs font-bold uppercase tracking-wide text-primary mb-2">
						{section.header}
					</Text>
					<View className="gap-1.5">
						{section.items.map((item, i) => {
							const colonIdx = item.indexOf(':');
							if (colonIdx > 0 && colonIdx < 50) {
								const key = item.slice(0, colonIdx).trim();
								const val = item.slice(colonIdx + 1).trim();
								return (
									<View key={i} className="flex-row items-start gap-2">
										<Text className="text-xs font-semibold text-foreground shrink-0">{key}:</Text>
										<Text className="text-xs text-foreground-secondary flex-1 leading-4">{val}</Text>
									</View>
								);
							}
							return (
								<View key={i} className="flex-row items-start gap-2">
									<View className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
									<Text className="text-xs text-foreground-secondary flex-1 leading-4">{item}</Text>
								</View>
							);
						})}
					</View>
				</View>
			))}
		</View>
	);
}

// Credit row 
function CreditRow({ label, value, odd }: { label: string; value: number | null | undefined; odd: boolean }) {
	return (
		<View className={['flex-row items-center justify-between px-3 py-1.5 rounded-lg', odd ? 'bg-surface-alt' : ''].join(' ')}>
			<Text className="text-xs text-foreground-secondary flex-1">{label}</Text>
			<Text className="text-xs font-semibold text-foreground">{value ?? '—'}</Text>
		</View>
	);
}

// Main Screen
export default function PerfilScreen() {
	const { user, token, logout, updateUser } = useAuth();

	const [showCourses, setShowCourses] = useState(false);
	const [showThesisModal, setShowThesisModal] = useState(false);
	const [editPersonal, setEditPersonal] = useState(false);
	const [saving, setSaving] = useState(false);

	// Editable personal fields
	const [nombre, setNombre] = useState(user?.estudiante.nombres_apellidos || '');
	const [codigo, setCodigo] = useState(user?.estudiante.codigo_matricula || '');
	const [facultad, setFacultad] = useState(user?.estudiante.facultad || '');
	const [escuela, setEscuela] = useState(user?.estudiante.escuela || '');
	const [plan, setPlan] = useState(user?.estudiante.plan || '');

	if (!user) return null;

	const openPdf = async (url?: string) => {
		if (!url) return;
		await WebBrowser.openBrowserAsync(url);
	};

	const handleLogout = () => {
		logout();
		router.replace('/(auth)/login');
	};

	const handleSavePersonal = async () => {
		if (!token) return;
		setSaving(true);
		try {
			const updated = await updateStudent(user.student_id, token, {
				nombres_apellidos: nombre,
				codigo_matricula: codigo,
				facultad,
				escuela,
				plan,
			});
			updateUser({
				estudiante: {
					nombres_apellidos: updated.estudiante.nombres_apellidos,
					codigo_matricula: updated.estudiante.codigo_matricula,
					facultad: updated.estudiante.facultad,
					escuela: updated.estudiante.escuela,
					plan: updated.estudiante.plan,
				},
			});
			setEditPersonal(false);

		} catch {
			console.error('Error al actualizar el perfil');
		} finally {
			setSaving(false);
		}
	};

	const personalFields = [
		{ label: 'Nombre completo', value: nombre, setter: setNombre, icon: 'user' as const },
		{ label: 'Código de matrícula', value: codigo, setter: setCodigo, icon: 'award' as const },
		{ label: 'Facultad', value: facultad, setter: setFacultad, icon: 'book-open' as const },
		{ label: 'Escuela', value: escuela, setter: setEscuela, icon: 'file-text' as const },
		{ label: 'Plan de estudios', value: plan, setter: setPlan, icon: 'calendar' as const },
	];

	const creditRows = [
		{ label: 'Creditaje Requerido para Egresar', value: user.resumen_creditos.creditaje_requerido_para_egresar },
		{ label: 'Creditaje Aprobado', value: user.resumen_creditos.creditaje_aprobado },
		{ label: 'Obligatorios', value: user.resumen_creditos.obligatorios },
		{ label: 'De Especialidad', value: user.resumen_creditos.de_especialidad },
		{ label: 'Electivos Generales', value: user.resumen_creditos.electivos_generales },
		{ label: 'Electivos de Especialidad', value: user.resumen_creditos.electivos_de_especialidad },
		{ label: 'Optativos', value: user.resumen_creditos.optativos },
		{ label: 'Alternativos', value: user.resumen_creditos.alternativos },
		{ label: 'De Otra Especialidad', value: user.resumen_creditos.de_otra_especialidad },
		{ label: 'Más de una vez', value: user.resumen_creditos.mas_de_una_vez },
		{ label: 'Otros', value: user.resumen_creditos.otros },
		{ label: 'Creditaje Faltante', value: user.resumen_creditos.creditaje_faltante },
		{ label: 'Promedio Ponderado', value: user.resumen_creditos.promedio_ponderado },
	];

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			{showCourses && (
				<CoursesModal periods={user.periodos_academicos} onClose={() => setShowCourses(false)} />
			)}
			{showThesisModal && (
				<ThesisIdeaModal
					onClose={() => setShowThesisModal(false)}
					onSuccess={() => setShowThesisModal(false)}
				/>
			)}

			<ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40, gap: 20 }} showsVerticalScrollIndicator={false}>
				<Text className="text-xl font-bold text-foreground text-center">Perfil del Estudiante</Text>

				{/* Avatar */}
				<View className="items-center gap-3">
					<View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
						<Feather name="user" size={28} color="#4F6D7A" />
					</View>
					<View className="items-center">
						<Text className="text-base font-semibold text-foreground">{user.estudiante.nombres_apellidos}</Text>
						<Text className="text-xs text-muted">Estudiante</Text>
					</View>
				</View>

				{/* Información Personal (editable) */}
				<Card>
					<View className="flex-row items-center justify-between mb-3">
						<Text className="text-sm font-semibold text-foreground">Información Personal</Text>
						{editPersonal ? (
							<View className="flex-row gap-2">
								<Pressable
									onPress={() => setEditPersonal(false)}
									className="px-3 py-1.5 rounded-lg border border-border"
								>
									<Text className="text-xs text-muted">Cancelar</Text>
								</Pressable>
								<Pressable
									onPress={handleSavePersonal}
									disabled={saving}
									className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary"
								>
									{saving ? <ActivityIndicator size="small" color="white" /> : null}
									<Text className="text-xs font-semibold text-white">Guardar</Text>
								</Pressable>
							</View>
						) : (
							<Pressable
								onPress={() => setEditPersonal(true)}
								className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-alt"
							>
								<Feather name="edit-2" size={12} color="#4F6D7A" />
								<Text className="text-xs font-medium text-primary">Editar</Text>
							</Pressable>
						)}
					</View>

					{personalFields.map(({ label, value, setter, icon }) => (
						<View key={label} className="py-2 border-b border-border/40">
							<View className="flex-row items-center gap-2 mb-1">
								<Feather name={icon} size={12} color="#8E8E9E" />
								<Text className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</Text>
							</View>
							{editPersonal ? (
								<TextInput
									value={value}
									onChangeText={setter}
									className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
									placeholderTextColorClassName="accent-muted"
									selectionColorClassName="accent-primary"
									cursorColorClassName="accent-primary"
									underlineColorAndroidClassName="accent-transparent"
								/>
							) : (
								<Text className="text-sm text-foreground pl-5">{value || '—'}</Text>
							)}
						</View>
					))}

					{/* GPA (no editable) */}
					<View className="mt-3 rounded-xl bg-primary/5 px-4 py-3">
						<Text className="text-xs font-medium text-muted">Promedio Ponderado</Text>
						<Text className="text-2xl font-black text-primary">{user.resumen_creditos.promedio_ponderado}</Text>
					</View>
				</Card>

				{/*  Idea de Tesis  */}
				<Card>
					<View className="flex-row items-center justify-between mb-2">
						<Text className="text-sm font-semibold text-foreground">Idea de Tesis</Text>
						<Pressable
							onPress={() => setShowThesisModal(true)}
							className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-alt"
						>
							<Feather name={user.thesis_idea ? 'edit-2' : 'plus'} size={12} color="#4F6D7A" />
							<Text className="text-xs font-medium text-primary">
								{user.thesis_idea ? 'Editar' : 'Agregar'}
							</Text>
						</Pressable>
					</View>
					{user.thesis_idea ? (
						<Text className="text-sm italic text-foreground-secondary leading-5">
							&ldquo;{user.thesis_idea}&rdquo;
						</Text>
					) : (
						<Text className="text-sm text-muted">Sin idea de tesis registrada.</Text>
					)}
				</Card>

				{/*  Documentos  */}
				<Card>
					<Text className="text-sm font-semibold text-foreground mb-3">Documentos</Text>
					<View className="gap-2">
						<PdfButton label="Historial Académico" url={user.pdf_urls?.historial} onPress={() => openPdf(user.pdf_urls?.historial)} />
						<PdfButton label="Matrícula Actual" url={user.pdf_urls?.matricula} onPress={() => openPdf(user.pdf_urls?.matricula)} />
						<PdfButton label="Curriculum Vitae (PDF)" url={user.pdf_urls?.cv} onPress={() => openPdf(user.pdf_urls?.cv)} />
					</View>
				</Card>

				{/*  Habilidades (CV)  */}
				<Card>
					<View className="flex-row items-center justify-between mb-3">
						<Text className="text-sm font-semibold text-foreground">Habilidades (CV)</Text>
						{user.pdf_urls?.cv && (
							<Pressable
								onPress={() => openPdf(user.pdf_urls?.cv)}
								className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-alt"
							>
								<Feather name="external-link" size={12} color="#4F6D7A" />
								<Text className="text-xs font-medium text-primary">Ver CV</Text>
							</Pressable>
						)}
					</View>
					<CvDisplay cvText={user.cv_text || ''} />
				</Card>

				{/*  Resumen de Créditos (completo)  */}
				<Card>
					<View className="flex-row items-center justify-between mb-3">
						<Text className="text-sm font-semibold text-foreground">Resumen de Créditos</Text>
						<Pressable
							onPress={() => setShowCourses(true)}
							className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-alt"
						>
							<Feather name="eye" size={12} color="#4F6D7A" />
							<Text className="text-xs font-medium text-primary">Ver historial</Text>
						</Pressable>
					</View>
					<View className="gap-0.5">
						{creditRows.map(({ label, value }, idx) => (
							<CreditRow key={label} label={label} value={value as number | null | undefined} odd={idx % 2 === 1} />
						))}
					</View>
				</Card>

				{/* Logout */}
				<Button title="Cerrar sesión" onPress={handleLogout} variant="outline" />
			</ScrollView>
		</SafeAreaView>
	);
}
