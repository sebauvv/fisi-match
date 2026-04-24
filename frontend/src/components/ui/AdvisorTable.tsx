import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Advisor } from '../../types/advisor';
import ResearchAreaBadge from './ResearchAreaBadge';
import { ExternalLink, BookOpen, FileText } from 'lucide-react';

interface AdvisorTableProps {
	advisors: Advisor[];
	loading?: boolean;
	total: number;
	limit: number;
	offset: number;
	onPaginationChange: (newLimit: number, newOffset: number) => void;
}

function extractOrcidId(orcid: string | null): string {
	if (!orcid) return 'No registrado';
	const match = orcid.match(/(\d{4}-\d{4}-\d{4}-\d{4})/);
	return match ? match[1] : orcid;
}

const SkeletonRow = () => (
	<tr className="border-b border-border dark:border-dark-border animate-pulse">
		{[1, 2, 3, 4, 5].map((i) => (
			<td key={i} className="px-4 py-3">
				<div className="h-3 rounded bg-bg-hover dark:bg-dark-bg-hover" />
			</td>
		))}
	</tr>
);

const AdvisorTable: React.FC<AdvisorTableProps> = ({
	advisors,
	loading = false,
	total,
	limit,
	offset,
	onPaginationChange,
}) => {
	const navigate = useNavigate();

	const currentPage = Math.floor(offset / limit) + 1;
	const totalPages = Math.ceil(total / limit) || 1;

	const handlePrev = () => {
		if (offset - limit >= 0) {
			onPaginationChange(limit, offset - limit);
		}
	};

	const handleNext = () => {
		if (offset + limit < total) {
			onPaginationChange(limit, offset + limit);
		}
	};

	const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newLimit = parseInt(e.target.value, 10);
		onPaginationChange(newLimit, 0); // Reset a page 0
	};


	const cols = [
		{ label: 'Nombre', className: 'w-52' },
		{ label: 'Áreas de Investigación', className: 'w-48' },
		{ label: 'DNI', className: 'w-24 text-center' },
		{ label: 'ORCID', className: 'w-44' },
		{ label: 'N° Tesis', className: 'w-24 text-center' },
		{ label: 'N° Pub. Externas', className: 'w-28 text-center' },
	];

	return (
		<div className="overflow-x-auto rounded-xl border border-border dark:border-dark-border">
			<table className="w-full text-sm border-collapse">
				<thead>
					<tr className="bg-bg-surface-alt dark:bg-dark-bg-surface-alt">
						{cols.map((col) => (
							<th
								key={col.label}
								className={`px-4 py-3 text-left text-[11px] uppercase tracking-widest font-semibold text-text-muted dark:text-dark-text-muted ${col.className ?? ''}`}
							>
								{col.label}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{loading ? (
						Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
					) : advisors.length === 0 ? (
						<tr>
							<td
								colSpan={5}
								className="px-4 py-12 text-center text-text-muted dark:text-dark-text-muted"
							>
								<div className="flex flex-col items-center gap-2">
									<BookOpen size={32} className="opacity-30" />
									<span className="text-sm">No se encontraron asesores</span>
								</div>
							</td>
						</tr>
					) : (
						advisors.map((advisor, idx) => {
							const orcidId = extractOrcidId(advisor.orcid);
							const hasOrcid = advisor.orcid !== null;
							return (
								<tr
									key={advisor.id}
									onClick={() => navigate(`/explorador-profesores/${advisor.id}`)}
									className={`
                    border-b border-border dark:border-dark-border
                    cursor-pointer transition-colors duration-100
                    hover:bg-accent-soft dark:hover:bg-dark-accent-soft
                    ${idx % 2 === 0
											? 'bg-bg-surface dark:bg-dark-bg-surface'
											: 'bg-bg-surface-alt dark:bg-dark-bg-surface-alt'
										}
                  `}
								>
									{/* Name */}
									<td className="px-4 py-3">
										<span className="font-medium text-accent dark:text-dark-accent hover:underline leading-snug">
											{advisor.full_name}
										</span>
									</td>

									{/* Research areas */}
									<td
										className="px-4 py-3"
										onClick={(e) => e.stopPropagation()}
									>
										<ResearchAreaBadge areas={advisor.research_areas} />
									</td>

									{/* DNI */}
									<td className="px-4 py-3 text-center text-xs text-text-secondary dark:text-dark-text-secondary">
										{advisor.advisor_dni || '-'}
									</td>

									{/* ORCID */}
									<td className="px-4 py-3">
										{hasOrcid ? (
											<a
												href={advisor.orcid!}
												target="_blank"
												rel="noopener noreferrer"
												onClick={(e) => e.stopPropagation()}
												className="flex items-center gap-1 text-xs font-mono text-accent dark:text-dark-accent hover:underline"
											>
												<ExternalLink size={10} className="shrink-0 opacity-70" />
												{orcidId}
											</a>
										) : (
											<span className="text-xs text-text-muted dark:text-dark-text-muted italic">
												No registrado
											</span>
										)}
									</td>

									{/* Thesis count */}
									<td className="px-4 py-3 text-center">
										<span className="inline-flex items-center gap-1 text-xs font-semibold text-text-primary dark:text-dark-text-primary">
											<BookOpen size={11} className="text-accent dark:text-dark-accent" />
											{advisor.thesis_count}
										</span>
									</td>

									{/* External publications */}
									<td className="px-4 py-3 text-center">
										<span className="inline-flex items-center gap-1 text-xs font-semibold text-text-primary dark:text-dark-text-primary">
											<FileText size={11} className="text-text-muted dark:text-dark-text-muted" />
											{advisor.external_publications_count}
										</span>
									</td>
								</tr>
							);
						})
					)}
				</tbody>
			</table>

			{/* Pagination Controls */}
			<div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-bg-surface dark:bg-dark-bg-surface border-t border-border dark:border-dark-border gap-4">
				<div className="flex items-center gap-2">
					<span className="text-sm text-text-secondary dark:text-dark-text-secondary">
						Mostrar
					</span>
					<select
						value={limit}
						onChange={handleLimitChange}
						className="text-sm border border-border dark:border-dark-border rounded-md px-2 py-1 bg-bg-surface dark:bg-dark-bg-surface text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
					>
						<option value={5}>5</option>
						<option value={10}>10</option>
						<option value={20}>20</option>
					</select>
					<span className="text-sm text-text-secondary dark:text-dark-text-secondary">
						asesores a la vez
					</span>
				</div>

				<div className="flex items-center gap-4">
					<span className="text-sm text-text-muted dark:text-dark-text-muted">
						Mostrando {advisors.length > 0 ? offset + 1 : 0} - {Math.min(offset + limit, total)} de {total}
					</span>
					
					<div className="flex gap-1">
						<button
							onClick={handlePrev}
							disabled={offset === 0}
							className="px-3 py-1 rounded border border-border dark:border-dark-border text-sm font-medium text-text-secondary dark:text-dark-text-secondary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							Anterior
						</button>
						<div className="px-3 py-1 text-sm text-text-primary dark:text-dark-text-primary bg-bg-surface-alt dark:bg-dark-bg-surface-alt font-semibold rounded">
							{currentPage} de {totalPages}
						</div>
						<button
							onClick={handleNext}
							disabled={offset + limit >= total}
							className="px-3 py-1 rounded border border-border dark:border-dark-border text-sm font-medium text-text-secondary dark:text-dark-text-secondary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							Siguiente
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AdvisorTable;
