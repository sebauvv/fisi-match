import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerStudent } from '../api/profileApi';
import { loginStudent } from '../api/authApi';
import type { AuthUser, StudentProfile } from '../types/student';

import ProgressBar from '../components/register/ProgressBar';
import StepCredentials from '../components/register/StepCredentials';
import StepHistorial from '../components/register/StepHistorial';
import StepMatricula from '../components/register/StepMatricula';
import StepCV from '../components/register/StepCV';
import StepConfirm from '../components/register/StepConfirm';
import LoadingOverlay from '../components/ui/LoadingOverlay';

const STEP_LABELS = ['Acceso', 'Historial', 'Matricula', 'CV', 'Confirmacion'];
const LOADING_MESSAGES = [
	'Subiendo archivos a la nube...',
	'Analizando historial academico...',
	'Procesando reporte de matricula...',
	'Extrayendo datos del CV con IA...',
	'Generando perfil del estudiante...',
];

export default function RegisterPage() {
	const [step, setStep] = useState(1);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [historialFile, setHistorialFile] = useState<File | null>(null);
	const [matriculaFile, setMatriculaFile] = useState<File | null>(null);
	const [cvFile, setCvFile] = useState<File | null>(null);
	const [isEgresado, setIsEgresado] = useState(false);
	const [loading, setLoading] = useState(false);
	const [loadingMsg, setLoadingMsg] = useState('');
	const [error, setError] = useState('');
	const [profileData, setProfileData] = useState<StudentProfile | null>(null);

	const navigate = useNavigate();
	const { login } = useAuth();

	// Cycles through loading messages while processing
	const startLoadingAnimation = () => {
		setLoading(true);
		let idx = 0;
		setLoadingMsg(LOADING_MESSAGES[0]);
		const interval = setInterval(() => {
			idx = (idx + 1) % LOADING_MESSAGES.length;
			setLoadingMsg(LOADING_MESSAGES[idx]);
		}, 3000);
		return interval;
	};

	// Called when step 4 advances to step 5 — sends all PDFs to the API
	const handleProcessPDFs = async () => {
		if (!historialFile || !cvFile) return;

		const loadingInterval = startLoadingAnimation();
		setError('');

		try {
			const profile = await registerStudent(
				email,
				password,
				historialFile,
				isEgresado ? null : matriculaFile,
				cvFile,
			);
			setProfileData(profile);

			// Autologin para obtener JWT antes del paso de confirmacion
			try {
				const authRes = await loginStudent(email, password);
				const user: AuthUser = {
					student_id: authRes.student_id,
					email: authRes.email,
					estudiante: profile.historial.estudiante,
					periodos_academicos: profile.historial.periodos_academicos,
					resumen_creditos: profile.historial.resumen_creditos,
					cv_text: profile.cv?.cv_text || '',
					pdf_urls: profile.pdf_urls,
				};
				login(user, authRes.access_token);
			} catch {
				// Si el auto-login falla, el estudiante quedara sin token
				console.error('Error al hacer autologin');
			}

			setStep(5);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al procesar los PDFs');
		} finally {
			clearInterval(loadingInterval);
			setLoading(false);
		}
	};

	// Called on step 5 confirm — auth ya fue seteada en handleProcessPDFs
	const handleConfirm = () => {
		navigate('/home');
	};

	return (
		<div className="flex min-h-screen flex-col items-center px-6 py-10 sm:px-8">
			{loading && <LoadingOverlay message={loadingMsg} />}

			{/* Header */}
			<div className="mb-8 text-center">
				<h1 className="text-2xl font-bold tracking-tight text-text-primary dark:text-dark-text-primary">
					FISI Match
				</h1>
				<p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
					Registro de estudiante
				</p>
			</div>

			{/* Progress bar */}
			<div className="mb-8 w-full max-w-2xl">
				<ProgressBar currentStep={step} totalSteps={5} labels={STEP_LABELS} />
			</div>

			{/* Error display */}
			{error && (
				<div className="mb-4 w-full max-w-md rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error dark:border-dark-error/30 dark:bg-dark-error/10 dark:text-dark-error">
					{error}
				</div>
			)}

			{/* Step content */}
			{step === 1 && (
				<StepCredentials
					email={email}
					password={password}
					onUpdate={(e, p) => { setEmail(e); setPassword(p); }}
					onNext={() => setStep(2)}
				/>
			)}
			{step === 2 && (
				<StepHistorial
					file={historialFile}
					onFileSelect={setHistorialFile}
					onClear={() => setHistorialFile(null)}
					onNext={() => setStep(3)}
				/>
			)}
			{step === 3 && (
				<StepMatricula
					file={matriculaFile}
					isEgresado={isEgresado}
					onFileSelect={setMatriculaFile}
					onClear={() => setMatriculaFile(null)}
					onToggleEgresado={() => {
						setIsEgresado(!isEgresado);
						if (!isEgresado) setMatriculaFile(null);
					}}
					onNext={() => setStep(4)}
				/>
			)}
			{step === 4 && (
				<StepCV
					file={cvFile}
					onFileSelect={setCvFile}
					onClear={() => setCvFile(null)}
					onNext={handleProcessPDFs}
				/>
			)}
			{step === 5 && profileData && (
				<StepConfirm profile={profileData} onConfirm={handleConfirm} />
			)}

			{/* Back to login */}
			{step === 1 && (
				<p className="mt-6 text-sm text-text-secondary dark:text-dark-text-secondary">
					Ya tienes cuenta?{' '}
					<Link to="/login" className="font-semibold text-accent hover:underline dark:text-dark-accent">
						Inicia sesion
					</Link>
				</p>
			)}
		</div>
	);
}
