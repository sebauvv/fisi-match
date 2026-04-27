import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { type RecommendationResult, generateAdvisorRecommendation } from '../api/recommendationApi';
import ProgressLoaderModal from '../components/recommendation/ProgressLoaderModal';
import AdvisorRecommendationResult from '../components/recommendation/AdvisorRecommendationResult';
import { Sparkles, BrainCircuit, SearchCheck, CheckCircle2, Search, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdvisorRecommendationPage() {
	const { user } = useAuth();
	const [isGenerating, setIsGenerating] = useState(false);
	const [apiComplete, setApiComplete] = useState(false);
	const [result, setResult] = useState<RecommendationResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const ideaText = user?.thesis_idea || "IDEA_FALTANTE_POR_FAVOR_REGISTRELA";

	const handleGenerate = async () => {
		setIsGenerating(true);
		setApiComplete(false);
		setResult(null);
		setError(null);

		try {
			const data = await generateAdvisorRecommendation(ideaText);
			setApiComplete(true);
			// brief pause so the user sees "step 4 done" before modal closes
			await new Promise((r) => setTimeout(r, 600));
			setResult(data);
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : "Error desconocido";
			setError(msg);
		} finally {
			setIsGenerating(false);
			setApiComplete(false);
		}
	};

	return (
		<div className="max-w-190 mx-auto px-6 py-10 pb-24">
			{/* Step Badge */}
			<div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent dark:bg-dark-accent/10 dark:text-dark-accent tracking-widest uppercase text-[0.7rem] font-bold border border-accent/20 mb-6">
				<span className="w-1.5 h-1.5 rounded-full bg-accent dark:bg-dark-accent"></span> Fase 3 · Motor de Recomendación
			</div>

			<h1 className="text-4xl md:text-5xl font-serif text-text-primary dark:text-dark-text-primary mb-3 font-normal tracking-tight">
				Recomendación de <em className="italic text-accent dark:text-dark-accent font-medium">asesor</em>
			</h1>
			<p className="text-text-muted dark:text-dark-text-muted max-w-xl text-[0.95rem] leading-relaxed mb-10">
				Analizador de idea de investigación de tesis con embeddings semánticos y rankeados según los profesores con mayor afinidad al tema.
			</p>

			{/* Idea Card */}
			<div className="relative p-6 px-7 rounded-2xl bg-bg-surface dark:bg-dark-bg-surface border border-border dark:border-dark-border overflow-hidden group mb-8 shadow-sm">
				<div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-accent to-accent/10 dark:from-dark-accent dark:to-dark-accent/10"></div>
				<div className="flex items-center gap-2 text-[0.75rem] uppercase tracking-wider font-semibold text-text-muted dark:text-dark-text-muted mb-3">
					<Sparkles size={14} className="text-accent dark:text-dark-accent" /> Tu idea de tesis
				</div>
				<p className="font-serif italic text-lg leading-relaxed text-text-primary dark:text-dark-text-primary">
					"{ideaText}"
				</p>
				<div className="flex items-center justify-between border-t border-border/60 dark:border-dark-border/60 mt-5 pt-4">
					<span className="text-xs text-text-muted dark:text-dark-text-muted flex items-center gap-1.5">
						<CheckCircle2 size={12} /> Guardado en tu perfil
					</span>
				</div>
			</div>

			{/* Feature Tiles */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
				<Tile icon={<BrainCircuit />} label="Método" value="Similitud semántica" />
				<Tile icon={<SearchCheck />} label="Resultado" value="Top 3–5 asesores rankeados" />
				<Tile icon={<Zap />} label="Con evidencia" value="Chunks de Tesis o Artículos" />
				<Tile icon={<Sparkles />} label="Recomendación" value="Justificada por LLM Nova Lite" />
			</div>

			{/* Error Banner */}
			{error && (
				<div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/30 text-error dark:bg-dark-error/10 dark:border-dark-error/30 dark:text-dark-error text-sm">
					<strong>Error al generar recomendación:</strong> {error}
				</div>
			)}

			{/* Actions */}
			{!result && (
				<div className="flex flex-col gap-3">
					<button
						onClick={handleGenerate}
						disabled={isGenerating}
						className="relative flex items-center justify-center gap-2.5 w-full py-4 bg-accent dark:bg-dark-accent hover:bg-accent-hover dark:hover:bg-dark-accent-hover transition-all rounded-xl text-white font-medium shadow-[0_4px_14px_-2px_rgba(79,109,122,0.3)] disabled:opacity-75 disabled:cursor-not-allowed group overflow-hidden"
					>
						<div className="absolute inset-0 bg-linear-to-r from-transparent via-white/15 to-transparent translate-x-[-200%] group-hover:animate-[shimmer_1.5s_infinite] skew-x-[-20deg]"></div>
						<Sparkles size={18} />
						{isGenerating ? "Procesando con IA..." : "Generar recomendación de asesor"}
					</button>

					<Link
						to="/explorador-profesores"
						className="flex items-center justify-center gap-2 w-full py-3.5 bg-transparent border border-border dark:border-dark-border hover:bg-bg-surface-alt dark:hover:bg-dark-bg-surface-alt transition-all rounded-xl text-text-muted hover:text-text-primary font-medium text-sm"
					>
						<Search size={16} /> Explorar profesores manualmente
					</Link>
				</div>
			)}

			{/* Explanation Steps Reference */}
			{!result && !isGenerating && (
				<div className="mt-12 pt-10 border-t border-border dark:border-dark-border opacity-70">
					<p className="text-xs uppercase tracking-widest text-text-muted font-semibold mb-6">¿Qué ocurre al generar?</p>
					<div className="space-y-5">
						<StepReference number={1} title="Vectorización de la idea" desc="Tu idea se convierte en un embedding semántico usando el modelo de lenguaje Titan v2." />
						<div className="w-px h-6 bg-border dark:bg-dark-border ml-3 -my-3"></div>
						<StepReference number={2} title="Cálculo de similitud" desc="Se compara tu vector con los perfiles de cada profesor a través de pgvector (kNN)." />
						<div className="w-px h-6 bg-border dark:bg-dark-border ml-3 -my-3"></div>
						<StepReference number={3} title="Ranking y justificación LLM" desc="Se puntúa con peso temporal y el LLM genera una justificación argumentando por qué son idóneos." />
					</div>
				</div>
			)}

			{/* Progress Overlay */}
			{isGenerating && <ProgressLoaderModal isComplete={apiComplete} />}

			{/* Result UI */}
			{result && <AdvisorRecommendationResult data={result} />}
		</div>
	);
}

function Tile({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
	return (
		<div className="flex items-start gap-3 p-4 bg-bg-surface-alt dark:bg-dark-bg-surface-alt rounded-xl border border-border dark:border-dark-border">
			<div className="w-10 h-10 rounded-lg bg-accent/10 dark:bg-dark-accent/10 text-accent dark:text-dark-accent flex items-center justify-center shrink-0">
				<div className="scale-90">{icon}</div>
			</div>
			<div>
				<p className="text-[0.65rem] uppercase tracking-wider text-text-muted dark:text-dark-text-muted font-bold mb-0.5">{label}</p>
				<p className="text-[0.9rem] text-text-primary dark:text-dark-text-primary font-medium">{value}</p>
			</div>
		</div>
	);
}

function StepReference({ number, title, desc }: { number: number, title: string, desc: string }) {
	return (
		<div className="flex gap-4">
			<div className="w-7 h-7 rounded-full border-2 border-border dark:border-dark-border flex items-center justify-center text-xs font-bold text-text-muted shrink-0 z-10 bg-bg-primary dark:bg-dark-bg-primary">{number}</div>
			<div className="-mt-1">
				<p className="text-sm font-medium text-text-primary dark:text-dark-text-primary mb-0.5">{title}</p>
				<p className="text-xs text-text-muted dark:text-dark-text-muted leading-relaxed max-w-sm">{desc}</p>
			</div>
		</div>
	);
}
