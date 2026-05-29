import { useState } from 'react';
import {
	View, Text, TextInput, Pressable, ScrollView,
	SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
	Modal,
} from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { registerStudent } from '../../api/profileApi';
import { loginStudent } from '../../api/authApi';
import { updateStudent } from '../../api/studentApi';
import type { AuthUser, StudentProfile } from '../../types/student';
import ErrorBanner from '../../components/ui/ErrorBanner';
import Button from '../../components/ui/Button';
import CoursesModal from '../../components/ui/CoursesModal';

const STEP_LABELS = ['Acceso', 'Historial', 'Matrícula', 'CV', 'Confirmación'];

type FileAsset = { uri: string; name: string; type: string };

// Step dots
function StepDots({ current, total }: { current: number; total: number }) {
	return (
		<View className="flex-row items-center justify-center gap-2 mb-8">
			{STEP_LABELS.map((label, i) => (
				<View key={label} className="items-center gap-1">
					<View
						className={[
							'w-7 h-7 rounded-full items-center justify-center',
							i + 1 < current
								? 'bg-primary'
								: i + 1 === current
									? 'bg-primary border-2 border-primary-soft'
									: 'bg-surface border border-border',
						].join(' ')}
					>
						{i + 1 < current ? (
							<Feather name="check" size={12} color="white" />
						) : (
							<Text className={['text-[10px] font-bold', i + 1 === current ? 'text-white' : 'text-muted'].join(' ')}>
								{i + 1}
							</Text>
						)}
					</View>
					<Text className="text-[9px] text-muted">{label}</Text>
				</View>
			))}
		</View>
	);
}

// File picker 
function FilePicker({ label, file, onPick, onClear }: {
	label: string;
	file: FileAsset | null;
	onPick: (f: FileAsset) => void;
	onClear: () => void;
}) {
	const pick = async () => {
		const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
		if (res.canceled || !res.assets?.[0]) return;
		const a = res.assets[0];
		onPick({ uri: a.uri, name: a.name, type: a.mimeType ?? 'application/pdf' });
	};

	return (
		<View className="gap-1.5">
			<Text className="text-sm font-medium text-foreground">{label}</Text>
			{file ? (
				<View className="flex-row items-center justify-between rounded-xl border border-primary bg-primary-soft px-4 py-3">
					<View className="flex-row items-center gap-2 flex-1">
						<Feather name="file-text" size={16} color="#4F6D7A" />
						<Text className="text-sm text-primary flex-1" numberOfLines={1}>{file.name}</Text>
					</View>
					<Pressable onPress={onClear}>
						<Feather name="x" size={16} color="#C44545" />
					</Pressable>
				</View>
			) : (
				<Pressable
					onPress={pick}
					className="rounded-xl border border-dashed border-border bg-surface px-4 py-6 items-center gap-2 active:bg-surface-alt"
				>
					<Feather name="upload" size={20} color="#8E8E9E" />
					<Text className="text-sm text-muted">Toca para seleccionar PDF</Text>
				</Pressable>
			)}
		</View>
	);
}

// Step 5: Confirm & Edit
function StepConfirm({
	profile,
	onConfirm,
}: {
	profile: StudentProfile;
	onConfirm: () => void;
}) {
	const { user, token, updateUser } = useAuth();
	const [showCourses, setShowCourses] = useState(false);
	const [editPersonal, setEditPersonal] = useState(false);
	const [editCV, setEditCV] = useState(false);
	const [saving, setSaving] = useState(false);

	const est = profile.historial.estudiante;
	const resumen = profile.historial.resumen_creditos;
	const periods = profile.historial.periodos_academicos;
	const cvText = profile.cv?.cv_text || '';

	const [nombre, setNombre] = useState(est.nombres_apellidos);
	const [codigo, setCodigo] = useState(est.codigo_matricula);
	const [facultad, setFacultad] = useState(est.facultad || '');
	const [escuela, setEscuela] = useState(est.escuela || '');
	const [plan, setPlan] = useState(est.plan || '');
	const [editableCvText, setEditableCvText] = useState(cvText);

	const creditRows = [
		{ label: 'Creditaje Requerido para Egresar', value: resumen.creditaje_requerido_para_egresar },
		{ label: 'Creditaje Aprobado', value: resumen.creditaje_aprobado },
		{ label: 'Obligatorios', value: resumen.obligatorios },
		{ label: 'De Especialidad', value: resumen.de_especialidad },
		{ label: 'Electivos Generales', value: resumen.electivos_generales },
		{ label: 'Electivos de Especialidad', value: resumen.electivos_de_especialidad },
		{ label: 'Optativos', value: resumen.optativos },
		{ label: 'Alternativos', value: resumen.alternativos },
		{ label: 'De Otra Especialidad', value: resumen.de_otra_especialidad },
		{ label: 'Más de una vez', value: resumen.mas_de_una_vez },
		{ label: 'Otros', value: resumen.otros },
		{ label: 'Creditaje Faltante', value: resumen.creditaje_faltante },
		{ label: 'Promedio Ponderado', value: resumen.promedio_ponderado },
	];

	const personalFields = [
		{ label: 'Nombre completo', value: nombre, setter: setNombre },
		{ label: 'Código de matrícula', value: codigo, setter: setCodigo },
		{ label: 'Facultad', value: facultad, setter: setFacultad },
		{ label: 'Escuela', value: escuela, setter: setEscuela },
		{ label: 'Plan de estudios', value: plan, setter: setPlan },
	];

	const handleConfirm = async () => {
		if (token && user?.student_id) {
			setSaving(true);
			try {
				const updated = await updateStudent(user.student_id, token, {
					nombres_apellidos: nombre,
					codigo_matricula: codigo,
					facultad,
					escuela,
					plan,
					cv_text: editableCvText,
				});
				updateUser({
					estudiante: {
						nombres_apellidos: updated.nombres_apellidos ?? nombre,
						codigo_matricula: updated.codigo_matricula ?? codigo,
						facultad: updated.facultad ?? facultad,
						escuela: updated.escuela ?? escuela,
						plan: updated.plan ?? plan,
					},
					cv_text: updated.cv_text ?? editableCvText,
				});
			} catch {
				// fallo silencioso: continua de todos modos
			} finally {
				setSaving(false);
			}
		}
		onConfirm();
	};

	return (
		<>
			{/* Section: Informacion Personal */}
			<View className="rounded-2xl border border-border bg-surface p-5 mb-4">
				<View className="flex-row items-center justify-between mb-4">
					<Text className="text-base font-semibold text-foreground">Información Personal</Text>
					<Pressable
						onPress={() => setEditPersonal(!editPersonal)}
						className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-alt"
					>
						<Feather name={editPersonal ? 'check' : 'edit-2'} size={12} color="#4F6D7A" />
						<Text className="text-xs font-medium text-primary">
							{editPersonal ? 'Listo' : 'Editar'}
						</Text>
					</Pressable>
				</View>
				<View className="gap-3">
					{personalFields.map(({ label, value, setter }) => (
						<View key={label}>
							<Text className="text-[10px] font-medium uppercase tracking-wide text-muted mb-1">{label}</Text>
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
								<View className="rounded-lg bg-surface-alt px-3 py-2">
									<Text className="text-sm text-foreground">{value || '—'}</Text>
								</View>
							)}
						</View>
					))}
				</View>
			</View>

			{/* Section: Historial Academico */}
			<View className="rounded-2xl border border-border bg-surface p-5 mb-4">
				<View className="flex-row items-center justify-between mb-4">
					<Text className="text-base font-semibold text-foreground">Historial del Estudiante</Text>
					<Pressable
						onPress={() => setShowCourses(true)}
						className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-alt"
					>
						<Feather name="eye" size={12} color="#4F6D7A" />
						<Text className="text-xs font-medium text-primary">Ver Todo</Text>
					</Pressable>
				</View>
				<Text className="text-[10px] font-medium uppercase tracking-wide text-muted mb-2">
					Resumen de Créditos
				</Text>
				<View className="gap-0.5">
					{creditRows.map(({ label, value }, idx) => (
						<View
							key={label}
							className={['flex-row items-center justify-between px-3 py-1.5 rounded-lg text-sm', idx % 2 === 0 ? '' : 'bg-surface-alt'].join(' ')}
						>
							<Text className="text-xs text-foreground-secondary flex-1">{label}</Text>
							<Text className="text-xs font-semibold text-foreground">{value ?? '—'}</Text>
						</View>
					))}
				</View>
			</View>

			{/* Section: Perfil Profesional (CV) */}
			<View className="rounded-2xl border border-border bg-surface p-5 mb-6">
				<View className="flex-row items-center justify-between mb-4">
					<Text className="text-base font-semibold text-foreground">Perfil Profesional</Text>
					<Pressable
						onPress={() => setEditCV(!editCV)}
						className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-alt"
					>
						<Feather name={editCV ? 'check' : 'edit-2'} size={12} color="#4F6D7A" />
						<Text className="text-xs font-medium text-primary">
							{editCV ? 'Listo' : 'Editar'}
						</Text>
					</Pressable>
				</View>
				{editCV ? (
					<TextInput
						value={editableCvText}
						onChangeText={setEditableCvText}
						multiline
						className="rounded-lg border border-border bg-background px-3 py-3 text-sm text-foreground font-mono"
						placeholderTextColorClassName="accent-muted"
						selectionColorClassName="accent-primary"
						cursorColorClassName="accent-primary"
						underlineColorAndroidClassName="accent-transparent"
						style={{ minHeight: 200, textAlignVertical: 'top' }}
						placeholder="No se proporcionó CV."
					/>
				) : (
					<View className="rounded-lg bg-surface-alt px-3 py-3">
						<Text className="text-sm text-foreground font-mono leading-5">
							{editableCvText || 'No se proporcionó CV.'}
						</Text>
					</View>
				)}
			</View>

			{/* Confirm button */}
			<Button
				title={saving ? 'Guardando...' : 'Confirmar y continuar'}
				onPress={handleConfirm}
				disabled={saving}
				loading={saving}
				className="w-full"
			/>

			{/* CoursesModal */}
			{showCourses && (
				<CoursesModal periods={periods} onClose={() => setShowCourses(false)} />
			)}
		</>
	);
}

// Main Screen 
export default function RegisterScreen() {
	const [step, setStep] = useState(1);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [historial, setHistorial] = useState<FileAsset | null>(null);
	const [matricula, setMatricula] = useState<FileAsset | null>(null);
	const [cv, setCv] = useState<FileAsset | null>(null);
	const [isEgresado, setIsEgresado] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [profileData, setProfileData] = useState<StudentProfile | null>(null);
	const { login } = useAuth();

	const handleProcessPDFs = async () => {
		if (!historial || !cv) return;
		setLoading(true);
		setError('');
		try {
			const profile = await registerStudent(
				email, password, historial, isEgresado ? null : matricula, cv,
			);
			setProfileData(profile);

			try {
				const authRes = await loginStudent(email, password);
				const user: AuthUser = {
					student_id: authRes.student_id,
					email: authRes.email,
					estudiante: profile.historial.estudiante,
					periodos_academicos: profile.historial.periodos_academicos,
					resumen_creditos: profile.historial.resumen_creditos,
					cv_text: profile.cv?.cv_text || '',
					thesis_idea: '',
					pdf_urls: profile.pdf_urls,
				};
				login(user, authRes.access_token);
			} catch {
				console.error('Auto-login fallido');
			}

			setStep(5);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al procesar los PDFs');
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView style={{ flex: 1 }} className="bg-background">
			{loading && (
				<View className="absolute inset-0 z-50 bg-black/60 items-center justify-center">
					<View className="bg-surface rounded-2xl p-8 items-center gap-4">
						<ActivityIndicator size="large" color="#4F6D7A" />
						<Text className="text-sm text-foreground">Procesando documentos con IA...</Text>
						<Text className="text-xs text-muted text-center">Esto puede tomar hasta 1 minuto</Text>
					</View>
				</View>
			)}

			<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
				<ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
					<Text className="text-2xl font-bold text-foreground text-center mb-1">FISI Match</Text>
					<Text className="text-sm text-muted text-center mb-8">Registro de estudiante</Text>

					<StepDots current={step} total={5} />

					{error ? <ErrorBanner message={error} /> : null}

					{/* Step 1: Credentials */}
					{step === 1 && (
						<View className="gap-4">
							<Text className="text-lg font-semibold text-foreground mb-2">Credenciales</Text>
							<View className="gap-1.5">
								<Text className="text-sm font-medium text-foreground">Correo institucional</Text>
								<TextInput
									value={email}
									onChangeText={setEmail}
									placeholder="usuario@unmsm.edu.pe"
									keyboardType="email-address"
									autoCapitalize="none"
									className="rounded-xl border border-border bg-background py-3 px-4 text-sm text-foreground"
									placeholderTextColorClassName="accent-muted"
									selectionColorClassName="accent-primary"
									cursorColorClassName="accent-primary"
									underlineColorAndroidClassName="accent-transparent"
								/>
							</View>
							<View className="gap-1.5">
								<Text className="text-sm font-medium text-foreground">Contraseña</Text>
								<TextInput
									value={password}
									onChangeText={setPassword}
									placeholder="Mínimo 8 caracteres"
									secureTextEntry
									autoCapitalize="none"
									className="rounded-xl border border-border bg-background py-3 px-4 text-sm text-foreground"
									placeholderTextColorClassName="accent-muted"
									selectionColorClassName="accent-primary"
									cursorColorClassName="accent-primary"
									underlineColorAndroidClassName="accent-transparent"
								/>
							</View>
							<Button title="Siguiente" onPress={() => setStep(2)} disabled={!email || !password} />
							<Pressable onPress={() => router.push('/(auth)/login')} className="items-center mt-2">
								<Text className="text-sm text-foreground-secondary">
									¿Ya tienes cuenta? <Text className="text-primary font-semibold">Inicia sesión</Text>
								</Text>
							</Pressable>
						</View>
					)}

					{/* Step 2: Historial */}
					{step === 2 && (
						<View className="gap-4">
							<Text className="text-lg font-semibold text-foreground mb-2">Historial Académico</Text>
							<Text className="text-sm text-muted mb-2">Sube tu historial académico en PDF (descargado del SIGA).</Text>
							<FilePicker label="Historial PDF" file={historial} onPick={setHistorial} onClear={() => setHistorial(null)} />
							<View className="flex-row gap-3 mt-2">
								<Button title="Atrás" onPress={() => setStep(1)} variant="outline" className="flex-1" />
								<Button title="Siguiente" onPress={() => setStep(3)} disabled={!historial} className="flex-1" />
							</View>
						</View>
					)}

					{/* Step 3: Matricula */}
					{step === 3 && (
						<View className="gap-4">
							<Text className="text-lg font-semibold text-foreground mb-2">Matrícula Actual</Text>
							<Pressable
								onPress={() => { setIsEgresado(!isEgresado); if (!isEgresado) setMatricula(null); }}
								className="flex-row items-center gap-3 mb-2"
							>
								<View className={['w-5 h-5 rounded border-2 items-center justify-center', isEgresado ? 'bg-primary border-primary' : 'border-border'].join(' ')}>
									{isEgresado && <Feather name="check" size={12} color="white" />}
								</View>
								<Text className="text-sm text-foreground">Soy egresado (no tengo matrícula activa)</Text>
							</Pressable>
							{!isEgresado && (
								<FilePicker label="Matrícula PDF" file={matricula} onPick={setMatricula} onClear={() => setMatricula(null)} />
							)}
							<View className="flex-row gap-3 mt-2">
								<Button title="Atrás" onPress={() => setStep(2)} variant="outline" className="flex-1" />
								<Button title="Siguiente" onPress={() => setStep(4)} disabled={!isEgresado && !matricula} className="flex-1" />
							</View>
						</View>
					)}

					{/* Step 4: CV */}
					{step === 4 && (
						<View className="gap-4">
							<Text className="text-lg font-semibold text-foreground mb-2">Curriculum Vitae</Text>
							<Text className="text-sm text-muted mb-2">La IA extraerá tus habilidades y experiencia del CV.</Text>
							<FilePicker label="CV PDF" file={cv} onPick={setCv} onClear={() => setCv(null)} />
							<View className="flex-row gap-3 mt-2">
								<Button title="Atrás" onPress={() => setStep(3)} variant="outline" className="flex-1" />
								<Button title="Procesar" onPress={handleProcessPDFs} disabled={!cv} loading={loading} className="flex-1" />
							</View>
						</View>
					)}

					{/* Step 5: Confirm */}
					{step === 5 && profileData && (
						<View className="gap-0">
							<View className="items-center mb-6">
								<View className="w-14 h-14 rounded-full bg-success-soft items-center justify-center mb-3">
									<Feather name="check-circle" size={28} color="#3D8B5E" />
								</View>
								<Text className="text-xl font-bold text-foreground text-center">¡Perfil procesado!</Text>
								<Text className="text-sm text-muted text-center mt-1">
									Revisa y edita tu información antes de continuar.
								</Text>
							</View>
							<StepConfirm
								profile={profileData}
								onConfirm={() => router.replace('/(app)/home')}
							/>
						</View>
					)}
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
