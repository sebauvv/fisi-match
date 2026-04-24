import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AdvisorProfilePage: React.FC = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	return (
		<div className="p-6">
			<button
				onClick={() => navigate(-1)}
				className="flex items-center gap-2 mb-6 text-text-secondary hover:text-text-primary transition-colors"
			>
				<ArrowLeft size={16} /> Volver
			</button>

			<div className="bg-bg-surface dark:bg-dark-bg-surface rounded-xl p-8 border border-border dark:border-dark-border shadow-sm">
				<h1 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-4">
					Perfil de Asesor
				</h1>
				<p className="text-text-secondary dark:text-dark-text-secondary">
					ID del asesor seleccionado: <span className="font-mono text-accent">{id}</span>
				</p>
				<div className="mt-8 p-12 text-center rounded-lg border-2 border-dashed border-border dark:border-dark-border">
					<p className="text-text-muted italic">
						(Mockup vacío por el momento).
					</p>
				</div>
			</div>
		</div>
	);
};

export default AdvisorProfilePage;
