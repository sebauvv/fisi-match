import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { advisorApi } from '../api/advisorApi';
import type { Advisor, ResearchArea } from '../types/advisor';
import AdvisorTable from '../components/ui/AdvisorTable';
import OrcidFilter from '../components/ui/OrcidFilter';

type SearchMode = 'name' | 'area';

const ALPHABET = [
	'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
	'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

interface GroupedAreas {
	[letter: string]: ResearchArea[];
}

const AdvisorExplorerPage: React.FC = () => {
	const [mode, setMode] = useState<SearchMode>('name');
	const [query, setQuery] = useState('');
	const [orcidFilter, setOrcidFilter] = useState<boolean | null>(null);

	// States for 'name' mode
	const [advisors, setAdvisors] = useState<Advisor[]>([]);
	const [loadingAdvisors, setLoadingAdvisors] = useState(false);
	
	// Pagination States
	const [limit, setLimit] = useState(10);
	const [offset, setOffset] = useState(0);
	const [total, setTotal] = useState(0);

	// States for 'area' mode
	const [allAreas, setAllAreas] = useState<ResearchArea[]>([]);
	const [loadingAreas, setLoadingAreas] = useState(false);
	const [selectedArea, setSelectedArea] = useState<ResearchArea | null>(null);

	const blockRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

	useEffect(() => {
		if (mode === 'area') {
			setLoadingAreas(true);
			advisorApi.getResearchAreas()
				.then((data) => setAllAreas(data))
				.catch(console.error)
				.finally(() => setLoadingAreas(false));
		}
	}, [mode]);

	useEffect(() => {
		let active = true;
		const fetchAdvisors = async () => {
			setLoadingAdvisors(true);
			try {
				if (mode === 'name') {
					const response = await advisorApi.getAdvisors({
						limit,
						offset,
						search_name: query,
						has_orcid: orcidFilter
					});
					if (active) {
						setAdvisors(response.items);
						setTotal(response.total);
					}
				} else if (mode === 'area' && selectedArea) {
					// Pasa la busqueda por area al nuevo parámetro del list_advisors real
					const response = await advisorApi.getAdvisors({
						limit,
						offset,
						search_area: selectedArea.name,
						has_orcid: orcidFilter
					});
					if (active) {
						setAdvisors(response.items);
						setTotal(response.total);
					}
				} else if (mode === 'area' && !selectedArea) {
					if (active) {
						setAdvisors([]);
						setTotal(0);
					}
				}
			} catch (err) {
				console.error(err);
			} finally {
				if (active) setLoadingAdvisors(false);
			}
		};

		fetchAdvisors();
		return () => { active = false; };
	}, [mode, query, selectedArea, orcidFilter, limit, offset]);

	// Group areas by letter
	const groupedAreas = useMemo(() => {
		const q = mode === 'area' && !selectedArea ? query.toLowerCase() : '';
		const filtered = allAreas.filter(a => a.name.toLowerCase().includes(q));

		const groups: GroupedAreas = {};
		for (const letter of ALPHABET) {
			groups[letter] = [];
		}

		filtered.forEach(area => {
			let firstChar = area.name.charAt(0).toUpperCase();
			// Normalize accented initial letters (except Ñ)
			if (['Á', 'Ä'].includes(firstChar)) firstChar = 'A';
			if (['É', 'Ë'].includes(firstChar)) firstChar = 'E';
			if (['Í', 'Ï'].includes(firstChar)) firstChar = 'I';
			if (['Ó', 'Ö'].includes(firstChar)) firstChar = 'O';
			if (['Ú', 'Ü'].includes(firstChar)) firstChar = 'U';

			if (groups[firstChar] !== undefined) {
				groups[firstChar].push(area);
			} else {
				// Fallback for symbols or numbers
				if (!groups['#']) groups['#'] = [];
				groups['#'].push(area);
			}
		});

		// Remove empty groups
		for (const key in groups) {
			if (groups[key].length === 0) {
				delete groups[key];
			} else {
				// Sort alphabetically within the group
				groups[key].sort((a, b) => a.name.localeCompare(b.name, 'es'));
			}
		}
		return groups;
	}, [allAreas, query, mode, selectedArea]);

	const activeLetters = Object.keys(groupedAreas).sort((a, b) => {
		if (a === '#') return 1;
		if (b === '#') return -1;
		return ALPHABET.indexOf(a) - ALPHABET.indexOf(b);
	});

	const scrollToLetter = (letter: string) => {
		if (blockRefs.current[letter]) {
			blockRefs.current[letter]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	};

	return (
		<div className="max-w-7xl mx-auto space-y-6">

			{/* Header */}
			<div className="flex flex-col items-center gap-4 text-center">
				<h1 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">
					Explorador de Asesores
				</h1>
			</div>

			{/* Main Container */}
			<div className="bg-bg-surface dark:bg-dark-bg-surface rounded-2xl shadow-sm border border-border dark:border-dark-border p-6">

				{/* Toggle Mode */}
				<div className="flex justify-center mb-6">
					<div className="inline-flex bg-bg-surface-alt dark:bg-dark-bg-surface-alt rounded-lg p-1">
						<button
							onClick={() => {
								setMode('name');
								setQuery('');
								setSelectedArea(null);
								setOffset(0);
							}}
							className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${mode === 'name'
									? 'bg-accent dark:bg-dark-accent text-white shadow'
									: 'text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary'
								}`}
						>
							Nombre
						</button>
						<button
							onClick={() => {
								setMode('area');
								setQuery('');
								setSelectedArea(null);
								setOffset(0);
							}}
							className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${mode === 'area'
									? 'bg-accent dark:bg-dark-accent text-white shadow'
									: 'text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary'
								}`}
						>
							Área
						</button>
					</div>
				</div>

				{/* Content specific to Mode */}

				{/* Name Mode */}
				{mode === 'name' && (
					<div className="space-y-6">
						<div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-bg-surface-alt dark:bg-dark-bg-surface-alt p-3 rounded-xl border border-border dark:border-dark-border">
							<div className="relative flex-1 w-full">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-dark-text-muted" size={18} />
								<input
									type="text"
									placeholder="Buscar por Nombre del Asesor..."
									value={query}
									onChange={(e) => {
										setQuery(e.target.value);
										setOffset(0); // reset page on search
									}}
									className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border dark:border-dark-border bg-bg-surface dark:bg-dark-bg-surface text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus dark:focus:ring-dark-border-focus transition-shadow text-sm"
								/>
							</div>
							<OrcidFilter value={orcidFilter} onChange={setOrcidFilter} />
						</div>

						<AdvisorTable 
							advisors={advisors} 
							loading={loadingAdvisors} 
							total={total} 
							limit={limit} 
							offset={offset} 
							onPaginationChange={(l, o) => { setLimit(l); setOffset(o); }} 
						/>
					</div>
				)}

				{/* Area Mode */}
				{mode === 'area' && (
					<div className="space-y-6">
						<div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-bg-surface-alt dark:bg-dark-bg-surface-alt p-3 rounded-xl border border-border dark:border-dark-border">
							<div className="relative flex-1 w-full">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-dark-text-muted" size={18} />
								{selectedArea ? (
									<div className="w-full pl-10 pr-4 py-2.5 flex items-center justify-between rounded-lg border border-border-focus dark:border-dark-border-focus bg-accent-soft dark:bg-dark-accent-soft">
										<span className="text-sm font-medium text-accent dark:text-dark-accent truncate">
											{selectedArea.name}
										</span>
										<button
											onClick={() => setSelectedArea(null)}
											className="text-[11px] font-semibold text-error dark:text-dark-error hover:underline ml-4 whitespace-nowrap bg-white dark:bg-black/20 px-2 py-0.5 rounded shadow-sm"
										>
											Volver
										</button>
									</div>
								) : (
									<input
										type="text"
										placeholder="Buscar Área..."
										value={query}
										onChange={(e) => {
											setQuery(e.target.value);
											setOffset(0); // reset page on new area search (though it groups locally)
										}}
										className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border dark:border-dark-border bg-bg-surface dark:bg-dark-bg-surface text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus dark:focus:ring-dark-border-focus transition-shadow text-sm"
									/>
								)}
							</div>
							<OrcidFilter value={orcidFilter} onChange={setOrcidFilter} />
						</div>

						{selectedArea ? (
							<AdvisorTable
								advisors={advisors}
								loading={loadingAdvisors}
								total={total}
								limit={limit}
								offset={offset}
								onPaginationChange={(l, o) => { setLimit(l); setOffset(o); }}
							/>
						) : (
							<div className="pt-2">
								{/* Alphabet Index */}
								<div className="sticky top-0 z-10 bg-bg-surface dark:bg-dark-bg-surface pb-6 pt-2 border-b border-border dark:border-dark-border">
									<div className="flex flex-wrap justify-center gap-1">
										{ALPHABET.map((l) => {
											const isActive = activeLetters.includes(l);
											return (
												<button
													key={l}
													disabled={!isActive}
													onClick={() => scrollToLetter(l)}
													className={`w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center text-xs font-bold transition-colors ${isActive
															? 'bg-bg-surface-alt dark:bg-dark-bg-surface-alt text-text-primary dark:text-dark-text-primary hover:bg-accent dark:hover:bg-dark-accent hover:text-white cursor-pointer shadow-sm'
															: 'bg-transparent text-text-muted dark:text-dark-text-muted opacity-30 cursor-not-allowed'
														}`}
												>
													{l}
												</button>
											);
										})}
									</div>
								</div>

								{/* Scrolly grid of areas */}
								<div className="mt-8 space-y-10 max-h-150 overflow-y-auto pr-4 custom-scrollbar">
									{loadingAreas && <p className="text-center text-sm text-text-muted dark:text-dark-text-muted">Cargando áreas...</p>}

									{!loadingAreas && activeLetters.length === 0 && (
										<p className="text-center text-sm text-text-muted dark:text-dark-text-muted py-12">No se encontraron áreas asociadas a la búsqueda.</p>
									)}

									{activeLetters.map((letter) => (
										<div
											key={letter}
											ref={(el) => { blockRefs.current[letter] = el; }}
											className="scroll-mt-32"
										>
											<h3 className="text-xl font-black text-accent dark:text-dark-accent border-b border-border dark:border-dark-border pb-2 mb-4">
												{letter}
											</h3>
											<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
												{groupedAreas[letter].map(area => (
													<div
														key={area.id}
														onClick={() => setSelectedArea(area)}
														className="group flex flex-col justify-between p-3 rounded-lg border border-transparent hover:border-border dark:hover:border-dark-border hover:bg-bg-surface-alt dark:hover:bg-dark-bg-surface-alt cursor-pointer transition-all"
													>
														<span className="text-sm text-text-secondary dark:text-dark-text-secondary group-hover:text-text-primary dark:group-hover:text-dark-text-primary leading-tight mb-2">
															{area.name}
														</span>
														<span className="text-[10px] font-semibold tracking-wider text-text-muted dark:text-dark-text-muted uppercase flex items-center justify-between">
															{area.advisor_count} asesor{area.advisor_count !== 1 && 'es'}
															<ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
														</span>
													</div>
												))}
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}

			</div>
		</div>
	);
};

export default AdvisorExplorerPage;
