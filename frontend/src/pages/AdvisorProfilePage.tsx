import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Link as LinkIcon, BookOpen, FileText, Calendar, BarChart2, X } from 'lucide-react';
import { advisorApi } from '../api/advisorApi';
import { publicationApi } from '../api/publicationApi';
import type { Publication } from '../api/publicationApi';
import { thesisApi } from '../api/thesisApi';
import type { Thesis } from '../api/thesisApi';
import type { Advisor } from '../types/advisor';

const PUB_TYPE_MAP: Record<string, { label: string, colorClass: string }> = {
	'journal-article': { label: 'Artículo de Revista', colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
	'conference-paper': { label: 'Artículo de Conf.', colorClass: 'text-accent bg-accent/10 border-accent/20' },
	'book-chapter': { label: 'Capítulo de Libro', colorClass: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
	'book': { label: 'Libro', colorClass: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
	'preprint': { label: 'Pre-impresión', colorClass: 'text-gray-500 bg-gray-500/10 border-gray-500/20' },
	'proceedings-article': { label: 'Artículo de Actas', colorClass: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
	'report': { label: 'Reporte', colorClass: 'text-pink-500 bg-pink-500/10 border-pink-500/20' },
};

const getPubType = (type: string | null) => {
	if (!type) return { label: 'Otro', colorClass: 'text-text-secondary bg-bg-surface border-border' };
	return PUB_TYPE_MAP[type] || { label: type, colorClass: 'text-text-secondary bg-bg-surface border-border' };
};

const AdvisorProfilePage: React.FC = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [advisor, setAdvisor] = useState<Advisor | null>(null);
	const [oldestYear, setOldestYear] = useState<number | null>(null);
	const [publications, setPublications] = useState<Publication[]>([]);
	const [theses, setTheses] = useState<Thesis[]>([]);
	
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<'pub' | 'thesis' | 'kw'>('pub');
	const [showStats, setShowStats] = useState(false);
	const [showAreasModal, setShowAreasModal] = useState(false);

	useEffect(() => {
		if (!id) return;
		let mounted = true;
		setLoading(true);

		Promise.all([
			advisorApi.getAdvisorById(id),
			advisorApi.getOldestThesisYear(id).catch(() => null),
			publicationApi.getPublications(id).catch(() => []),
			thesisApi.getTheses(id).catch(() => [])
		]).then(([adv, year, pubs, ths]) => {
			if (mounted) {
				setAdvisor(adv);
				setOldestYear(year);
				setPublications(pubs);
				setTheses(ths);
				setLoading(false);
			}
		});

		return () => { mounted = false; };
	}, [id]);

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="flex flex-col items-center gap-3">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent dark:border-dark-accent dark:border-r-transparent"></div>
					<p className="text-sm text-text-muted dark:text-dark-text-muted">Cargando perfil...</p>
				</div>
			</div>
		);
	}

	if (!advisor) {
		return (
			<div className="p-8 text-center">
				<p className="text-error dark:text-dark-error">Asesor no encontrado.</p>
				<button onClick={() => navigate(-1)} className="mt-4 text-accent hover:underline">Volver</button>
			</div>
		);
	}

	const orcidId = advisor.orcid ? advisor.orcid.match(/(\d{4}-\d{4}-\d{4}-\d{4})/) : null;
	const visibleAreas = advisor.research_areas.slice(0, 3);
	const hiddenAreasCount = Math.max(0, advisor.research_areas.length - 3);

	return (
		<div className="relative min-h-[calc(100vh-64px)] overflow-x-hidden">
			
			{/* HERO BACKGROUND */}
			<div className="h-60 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 dark:from-indigo-950 dark:via-black dark:to-slate-900 relative">
				<div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
				<button
					onClick={() => navigate('/explorador-profesores')}
					className="absolute top-6 left-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm"
				>
					<ArrowLeft size={16} /> Volver al explorador
				</button>
			</div>

			<div className="max-w-6xl mx-auto px-4 sm:px-6 relative pb-20">
				
				{/* PROFILE CARD */}
				<div className="relative -mt-24 bg-bg-surface dark:bg-dark-bg-surface border border-border dark:border-dark-border rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/50 p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start mb-8 z-10 animate-fade-in-up">
					
					{/* Avatar */}
					<div className="shrink-0 relative">
						<div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-100 dark:from-indigo-900 dark:to-slate-800 border-4 border-bg-surface dark:border-dark-bg-surface flex items-center justify-center shadow-inner overflow-hidden">
							<User size={48} className="text-indigo-400/50 dark:text-indigo-300/30" />
						</div>
						<div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-bg-surface dark:border-dark-bg-surface shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
					</div>

					{/* Info */}
					<div className="flex-1 min-w-0">
						<h1 className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-dark-text-primary mb-2 font-serif tracking-tight leading-tight">
							{advisor.full_name}
						</h1>

						<div className="flex items-center gap-3 mb-3">
							{advisor.orcid && orcidId ? (
								<a
									href={advisor.orcid}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
								>
									<LinkIcon size={12} />
									ORCID: {orcidId[1]}
								</a>
							) : (
								<span className="text-xs text-text-muted italic">ORCID no disponible</span>
							)}
						</div>

						{/* Areas Row */}
						{advisor.research_areas.length > 0 && (
							<div className="flex flex-wrap items-center gap-2 mb-4">
								{visibleAreas.map(area => (
									<span key={area} className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-medium">
										{area}
									</span>
								))}
								{hiddenAreasCount > 0 && (
									<button
										onClick={() => setShowAreasModal(true)}
										className="text-xs font-medium text-accent hover:underline px-1 py-0.5"
									>
										+{hiddenAreasCount} más
									</button>
								)}
							</div>
						)}

						{/* Meta Info */}
						<div className="flex flex-wrap gap-x-6 gap-y-3 mt-4">
							<div className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
								<BookOpen size={16} className="text-accent" />
								<span><strong className="text-text-primary dark:text-dark-text-primary">{advisor.thesis_count}</strong> estudiantes asesorados</span>
							</div>
							<div className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
								<svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
								</svg>
								<span>Facultad de Ingeniería de Sistemas e Informática</span>
							</div>
							<div className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
								<Calendar size={16} className="text-accent" />
								<span>
									{oldestYear ? `Asesorando desde ${oldestYear}` : 'Fecha de inicio no registrada'}
								</span>
							</div>
						</div>
					</div>

					{/* Actions */}
					<div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
						<button 
							onClick={() => setShowStats(!showStats)}
							className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-sm font-semibold hover:bg-yellow-500/20 transition-colors w-full"
						>
							<BarChart2 size={16} />
							{showStats ? 'Ocultar estadísticas' : 'Ver estadísticas'}
						</button>
					</div>
				</div>

				{/* STATS PANEL */}
				{showStats && (
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in-up">
						<div className="bg-bg-surface-alt dark:bg-dark-bg-surface-alt border border-border dark:border-dark-border rounded-xl p-5 text-center">
							<div className="text-3xl font-bold font-serif text-accent mb-1">{advisor.external_publications_count}</div>
							<div className="text-sm text-text-muted">Publicaciones totales</div>
						</div>
						<div className="bg-bg-surface-alt dark:bg-dark-bg-surface-alt border border-border dark:border-dark-border rounded-xl p-5 text-center">
							<div className="text-3xl font-bold font-serif text-emerald-500 dark:text-emerald-400 mb-1">{advisor.thesis_count}</div>
							<div className="text-sm text-text-muted">Tesis asesoradas</div>
						</div>
						<div className="bg-bg-surface-alt dark:bg-dark-bg-surface-alt border border-border dark:border-dark-border rounded-xl p-5 text-center">
							<div className="text-3xl font-bold font-serif text-yellow-500 dark:text-yellow-400 mb-1">
								{oldestYear ? new Date().getFullYear() - oldestYear : '-'}
							</div>
							<div className="text-sm text-text-muted">Años de experiencia</div>
						</div>
					</div>
				)}

				{/* TABS */}
				<div className="flex gap-1 border-b border-border dark:border-dark-border mb-6">
					<button 
						onClick={() => setActiveTab('pub')}
						className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pub' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
					>
						Publicaciones
					</button>
					<button 
						onClick={() => setActiveTab('thesis')}
						className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'thesis' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
					>
						Tesis asesoradas
					</button>
					<button 
						onClick={() => setActiveTab('kw')}
						className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'kw' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
					>
						Palabras clave
					</button>
				</div>

				{/* TAB CONTENT */}

				{/* Publications Tab */}
				{activeTab === 'pub' && (
					<div className="animate-fade-in">
						<div className="flex items-center justify-between mb-5">
							<h3 className="text-lg font-serif font-bold text-text-primary dark:text-dark-text-primary flex items-center gap-2">
								Publicaciones recientes
								<span className="bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-full">{advisor.external_publications_count}</span>
							</h3>
						</div>

						{publications.length === 0 ? (
							<div className="text-center p-12 bg-bg-surface-alt dark:bg-dark-bg-surface-alt rounded-2xl border border-dashed border-border dark:border-dark-border">
								<FileText className="mx-auto h-10 w-10 text-text-muted opacity-50 mb-3" />
								<p className="text-sm text-text-muted">Este asesor aún no cuenta con publicaciones externas registradas.</p>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{publications.map(pub => {
									const pType = getPubType(pub.type);
									return (
										<a 
											key={pub.id}
											href={pub.external_url || '#'}
											target={pub.external_url ? "_blank" : "_self"}
											rel="noopener noreferrer"
											className="block bg-bg-surface-alt dark:bg-dark-bg-surface-alt border border-border dark:border-dark-border rounded-xl p-5 hover:border-accent/40 hover:-translate-y-1 hover:shadow-lg transition-all relative overflow-hidden group"
										>
											<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
											<div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 border ${pType.colorClass}`}>
												{pType.label}
											</div>
											<h4 className="text-sm font-medium text-text-primary dark:text-dark-text-primary leading-snug mb-3">
												{pub.title}
											</h4>
											<div className="text-xs text-text-muted flex items-center justify-between">
												<span>{pub.year || 'Año N/A'} {pub.journal ? `· ${pub.journal}` : ''}</span>
											</div>
										</a>
									);
								})}
							</div>
						)}
					</div>
				)}

				{/* Theses Tab */}
				{activeTab === 'thesis' && (
					<div className="animate-fade-in">
						<div className="flex items-center justify-between mb-5">
							<h3 className="text-lg font-serif font-bold text-text-primary dark:text-dark-text-primary flex items-center gap-2">
								Tesis asesoradas
								<span className="bg-red-500/10 text-red-500 dark:text-red-400 text-xs px-2 py-0.5 rounded-full">{advisor.thesis_count}</span>
							</h3>
						</div>

						{theses.length === 0 ? (
							<div className="text-center p-12 bg-bg-surface-alt dark:bg-dark-bg-surface-alt rounded-2xl border border-dashed border-border dark:border-dark-border">
								<BookOpen className="mx-auto h-10 w-10 text-text-muted opacity-50 mb-3" />
								<p className="text-sm text-text-muted">Este asesor aún no cuenta con tesis registradas.</p>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{theses.map(thesis => (
									<div key={thesis.id} className="bg-bg-surface-alt dark:bg-dark-bg-surface-alt border border-border dark:border-dark-border rounded-xl p-5 hover:border-red-400/40 hover:-translate-y-1 hover:shadow-lg transition-all relative overflow-hidden group cursor-default">
										<div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 to-purple-500 rounded-l-xl"></div>
										<div className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2 opacity-80">
											{thesis.author} · {thesis.year}
										</div>
										<h4 className="text-sm font-medium text-text-primary dark:text-dark-text-primary leading-snug mb-3">
											{thesis.title}
										</h4>
										<div className="text-xs text-text-muted mt-auto pt-2 border-t border-border dark:border-dark-border">
											{thesis.degree_name || 'Grado no especificado'}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* Keywords Tab */}
				{activeTab === 'kw' && (
					<div className="animate-fade-in">
						<div className="bg-bg-surface-alt dark:bg-dark-bg-surface-alt border border-border dark:border-dark-border rounded-2xl p-6 sm:p-8">
							<h3 className="text-lg font-serif font-bold text-text-primary dark:text-dark-text-primary mb-4">
								Palabras clave frecuentes
							</h3>
							
							{advisor.research_areas.length === 0 ? (
								<p className="text-sm text-text-muted">No se han registrado palabras clave / áreas de investigación.</p>
							) : (
								<div className="flex flex-wrap gap-2 pt-2">
									{advisor.research_areas.map((area, idx) => {
										// Alternate colors for a "cloud" look visually
										const isLg = idx % 3 === 0;
										const isMd = idx % 5 === 0;
										
										let colorClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs";
										if (isLg) colorClass = "bg-accent/10 text-accent border-accent/30 text-sm font-semibold";
										else if (isMd) colorClass = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-sm";
										
										return (
											<span key={area} className={`px-3 py-1.5 rounded-full border cursor-default hover:scale-105 transition-transform ${colorClass}`}>
												{area}
											</span>
										);
									})}
								</div>
							)}
						</div>
					</div>
				)}

			</div>

			{/* AREAS MODAL */}
			{showAreasModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 shadow-xl backdrop-blur-sm animate-fade-in">
					<div className="bg-bg-surface dark:bg-dark-bg-surface w-full max-w-lg rounded-2xl border border-border dark:border-dark-border shadow-2xl flex flex-col max-h-[80vh]">
						<div className="flex items-center justify-between p-4 border-b border-border dark:border-dark-border">
							<h3 className="text-lg font-serif font-bold text-text-primary dark:text-dark-text-primary">
								Todas las áreas de investigación
							</h3>
							<button onClick={() => setShowAreasModal(false)} className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-bg-surface-alt dark:hover:bg-dark-bg-surface-alt">
								<X size={20} />
							</button>
						</div>
						<div className="p-4 overflow-y-auto w-full custom-scrollbar flex-1">
							<div className="flex flex-wrap gap-2">
								{advisor.research_areas.map(area => (
									<span key={area} className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-medium">
										{area}
									</span>
								))}
							</div>
						</div>
						<div className="p-4 border-t border-border dark:border-dark-border flex justify-end">
							<button onClick={() => setShowAreasModal(false)} className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors">
								Cerrar
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AdvisorProfilePage;
