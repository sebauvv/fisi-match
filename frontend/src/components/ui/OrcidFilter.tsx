import React from 'react';

interface OrcidFilterProps {
	value: boolean | null;
	onChange: (val: boolean | null) => void;
}

const options: { label: string; value: boolean | null }[] = [
	{ label: 'Todos', value: null },
	{ label: 'Con ORCID', value: true },
	{ label: 'Sin ORCID', value: false },
];

const OrcidFilter: React.FC<OrcidFilterProps> = ({ value, onChange }) => {
	return (
		<div className="flex items-center gap-1 rounded-lg p-1 bg-bg-surface-alt dark:bg-dark-bg-surface-alt">
			{options.map((opt) => (
				<button
					key={String(opt.value)}
					onClick={() => onChange(opt.value)}
					className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 ${value === opt.value
							? 'bg-accent dark:bg-dark-accent text-white shadow-sm'
							: 'text-text-secondary dark:text-dark-text-secondary hover:bg-bg-hover dark:hover:bg-dark-bg-hover'
						}`}
				>
					{opt.label}
				</button>
			))}
		</div>
	);
};

export default OrcidFilter;
