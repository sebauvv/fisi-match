import React, { useState, useRef, useEffect } from 'react';

interface ResearchAreaBadgeProps {
	areas: string[];
}

const MAX_PREVIEW = 5;
const MAX_CHAR = 30;

function truncate(s: string, max: number) {
	return s.length > max ? s.slice(0, max) + '…' : s;
}

const ResearchAreaBadge: React.FC<ResearchAreaBadgeProps> = ({ areas }) => {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		if (open) document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [open]);

	if (areas.length === 0) {
		return (
			<span className="text-text-muted dark:text-dark-text-muted text-xs italic">
				Sin áreas
			</span>
		);
	}

	const preview = areas.slice(0, MAX_PREVIEW);
	const remaining = areas.length - MAX_PREVIEW;

	return (
		<div className="relative" ref={ref}>
			<button
				onClick={() => setOpen((v) => !v)}
				className="text-left group"
				title={areas[0]}
			>
				<span className="text-xs text-accent dark:text-(--color-dark-accent) hover:underline cursor-pointer font-medium leading-tight">
					{truncate(areas[0], MAX_CHAR)}
				</span>
				{areas.length > 1 && (
					<span className="ml-1 text-xs text-text-muted dark:text-dark-text-muted">
						+{areas.length - 1}
					</span>
				)}
			</button>

			{open && (
				<div
					className="absolute z-50 left-0 top-full mt-1 w-72 rounded-xl shadow-xl border border-border dark:border-dark-border bg-bg-surface dark:bg-dark-bg-surface p-3"
					style={{ minWidth: '220px' }}
				>
					<p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted dark:text-dark-text-muted mb-2">
						Áreas de Investigación
					</p>
					<ul className="space-y-1">
						{preview.map((area, i) => (
							<li key={i} className="flex items-start gap-1.5">
								<span className="mt-1 w-1.5 h-1.5 rounded-full bg-accent dark:bg-dark-accent shrink-0" />
								<span className="text-xs text-text-primary dark:text-dark-text-primary leading-snug">
									{truncate(area, 60)}
								</span>
							</li>
						))}
					</ul>
					{remaining > 0 && (
						<p className="mt-2 text-[11px] text-text-muted dark:text-dark-text-muted font-medium">
							+ {remaining} área{remaining !== 1 ? 's' : ''} más
						</p>
					)}
				</div>
			)}
		</div>
	);
};

export default ResearchAreaBadge;
