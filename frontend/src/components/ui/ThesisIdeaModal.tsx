import { createPortal } from 'react-dom';
import { useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateStudent } from '../../api/studentApi';

interface ThesisIdeaModalProps {
	onClose: () => void;
	onSuccess: () => void;
	onError: (msg: string) => void;
}

export default function ThesisIdeaModal({ onClose, onSuccess, onError }: ThesisIdeaModalProps) {
	const { user, token, updateUser } = useAuth();
	const [idea, setIdea] = useState(user?.thesis_idea || '');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleSave = async () => {
		if (!idea.trim()) {
			setError('La idea de tesis no puede estar vacía');
			return;
		}
		if (!user || !token) return;

		setLoading(true);
		setError('');
		try {
			// Persist in DB
			await updateStudent(user.student_id, token, { thesis_idea: idea });
			// Local session update
			updateUser({ thesis_idea: idea });
			onSuccess();
		} catch (e: unknown) {
			const errorMsg = e instanceof Error ? e.message : 'Error al guardar la idea de tesis';
			setError(errorMsg);
			onError(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	return createPortal(
		<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
			<div className="bg-bg-surface dark:bg-dark-bg-surface w-full max-w-lg rounded-2xl border border-border dark:border-dark-border shadow-2xl flex flex-col p-6 animate-fade-in-up">

				<div className="flex items-center gap-3 mb-2 text-accent">
					<div className="p-2 bg-accent/10 rounded-xl">
						<BookOpen size={24} />
					</div>
					<h2 className="text-xl font-serif font-bold text-text-primary dark:text-dark-text-primary">Insertar Idea de Tesis</h2>
				</div>

				<p className="text-sm text-text-muted dark:text-dark-text-muted mb-6">
					Escribe el titulo de la idea de tesis del sistema, herramienta o investigación que deseas plantear. Esto nos proporcionará el contexto para recomendar asesores precisos y dar reportes de alineamiento metodológico.
				</p>

				<textarea
					value={idea}
					onChange={e => { setIdea(e.target.value); setError(''); }}
					className="w-full h-32 p-3 bg-bg-surface-alt dark:bg-dark-bg-surface-alt border border-border dark:border-dark-border rounded-xl text-sm text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 resize-custom-scrollbar"
					placeholder="Ej: Desarrollo e Implementación de un Sistema Web para Comercios del Área de..."
				/>

				{error && (
					<p className="text-error dark:text-dark-error text-xs font-medium mt-2">{error}</p>
				)}

				<div className="flex justify-end gap-3 mt-6">
					<button
						onClick={onClose}
						disabled={loading}
						className="px-4 py-2 rounded-xl text-sm font-medium text-text-secondary dark:text-dark-text-secondary hover:bg-bg-surface-alt dark:hover:bg-dark-bg-surface-alt transition-colors"
					>
						Saltar por ahora
					</button>
					<button
						onClick={handleSave}
						disabled={loading || !idea.trim()}
						className="flex items-center gap-2 px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? <Loader2 size={16} className="animate-spin" /> : null}
						{loading ? 'Guardando...' : 'Guardar y Continuar'}
					</button>
				</div>
			</div>
		</div>,
		document.body
	);
}
