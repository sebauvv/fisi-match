import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface StepCredentialsProps {
	email: string;
	password: string;
	onUpdate: (email: string, password: string) => void;
	onNext: () => void;
}

export default function StepCredentials({ email, password, onUpdate, onNext }: StepCredentialsProps) {
	const [showPw, setShowPw] = useState(false);
	const [errors, setErrors] = useState({ email: '', password: '' });

	const validate = () => {
		const newErrors = { email: '', password: '' };
		if (!email.endsWith('@unmsm.edu.pe')) {
			newErrors.email = 'Solo se aceptan correos @unmsm.edu.pe';
		}
		if (password.length < 6) {
			newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
		}
		setErrors(newErrors);
		return !newErrors.email && !newErrors.password;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (validate()) onNext();
	};

	return (
		<form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-5 m-7">
			<h2 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">
				Datos de acceso
			</h2>
			<p className="text-sm text-text-secondary dark:text-dark-text-secondary">
				Usa tu correo institucional de la UNMSM para registrarte.
			</p>

			{/* Email */}
			<div>
				<label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-dark-text-primary">
					Correo institucional
				</label>
				<div className="relative">
					<Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted dark:text-dark-text-muted" />
					<input
						type="email"
						value={email}
						onChange={(e) => onUpdate(e.target.value, password)}
						placeholder="usuario@unmsm.edu.pe"
						className="w-full rounded-xl border border-border bg-bg-surface py-3 pl-10 pr-4 text-sm text-text-primary outline-none transition-colors focus:border-accent dark:border-dark-border dark:bg-dark-bg-surface dark:text-dark-text-primary dark:focus:border-dark-accent"
					/>
				</div>
				{errors.email && <p className="mt-1 text-xs text-error dark:text-dark-error">{errors.email}</p>}
			</div>

			{/* Password */}
			<div>
				<label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-dark-text-primary">
					Contraseña
				</label>
				<div className="relative">
					<Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted dark:text-dark-text-muted" />
					<input
						type={showPw ? 'text' : 'password'}
						value={password}
						onChange={(e) => onUpdate(email, e.target.value)}
						placeholder="Minimo 6 caracteres"
						className="w-full rounded-xl border border-border bg-bg-surface py-3 pl-10 pr-10 text-sm text-text-primary outline-none transition-colors focus:border-accent dark:border-dark-border dark:bg-dark-bg-surface dark:text-dark-text-primary dark:focus:border-dark-accent"
					/>
					<button
						type="button"
						onClick={() => setShowPw(!showPw)}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-dark-text-muted"
					>
						{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
					</button>
				</div>
				{errors.password && <p className="mt-1 text-xs text-error dark:text-dark-error">{errors.password}</p>}
			</div>

			<button
				type="submit"
				className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover dark:bg-dark-accent dark:hover:bg-dark-accent-hover"
			>
				Siguiente
			</button>
		</form>
	);
}
