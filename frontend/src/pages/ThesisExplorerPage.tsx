import React, { useState, useEffect } from 'react';
import { Search, BookOpen, ExternalLink } from 'lucide-react';
import { thesisApi, type Thesis } from '../api/thesisApi';

const SkeletonRow = () => (
    <tr className="border-b border-border dark:border-dark-border animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
            <td key={i} className="px-4 py-3">
                <div className="h-3 rounded bg-bg-hover dark:bg-dark-bg-hover" />
            </td>
        ))}
    </tr>
);

const ThesisExplorerPage: React.FC = () => {
    const [theses, setTheses] = useState<Thesis[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [limit, setLimit] = useState(10);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        let active = true;
        setLoading(true);
        thesisApi.getTheses({ limit, offset, search: search || undefined })
            .then((res) => { if (active) { setTheses(res.items); setTotal(res.total); } })
            .catch(console.error)
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [search, limit, offset]);

    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit) || 1;

    const cols = ['Título', 'Autor', 'Año', 'Asesor', 'Grado', 'Enlace'];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col items-center gap-4 text-center">
                <h1 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">
                    Explorador de Tesis
                </h1>
            </div>

            <div className="bg-bg-surface dark:bg-dark-bg-surface rounded-2xl shadow-sm border border-border dark:border-dark-border p-6 space-y-6">
                <div className="flex items-center gap-4 bg-bg-surface-alt dark:bg-dark-bg-surface-alt p-3 rounded-xl border border-border dark:border-dark-border">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-dark-text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por título de tesis..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border dark:border-dark-border bg-bg-surface dark:bg-dark-bg-surface text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus dark:focus:ring-dark-border-focus text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border dark:border-dark-border">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-bg-surface-alt dark:bg-dark-bg-surface-alt">
                                {cols.map((col) => (
                                    <th key={col} className="px-4 py-3 text-left text-[11px] uppercase tracking-widest font-semibold text-text-muted dark:text-dark-text-muted">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : theses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-text-muted dark:text-dark-text-muted">
                                        <div className="flex flex-col items-center gap-2">
                                            <BookOpen size={32} className="opacity-30" />
                                            <span className="text-sm">No se encontraron tesis</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                theses.map((t, idx) => (
                                    <tr key={t.id} className={`border-b border-border dark:border-dark-border transition-colors hover:bg-accent-soft dark:hover:bg-dark-accent-soft ${idx % 2 === 0 ? 'bg-bg-surface dark:bg-dark-bg-surface' : 'bg-bg-surface-alt dark:bg-dark-bg-surface-alt'}`}>
                                        <td className="px-4 py-3 max-w-xs">
                                            <span className="font-medium text-text-primary dark:text-dark-text-primary leading-snug line-clamp-2">{t.title}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-text-secondary dark:text-dark-text-secondary whitespace-nowrap">{t.author ?? '-'}</td>
                                        <td className="px-4 py-3 text-xs text-center text-text-secondary dark:text-dark-text-secondary">{t.year ?? '-'}</td>
                                        <td className="px-4 py-3 text-xs text-text-secondary dark:text-dark-text-secondary whitespace-nowrap">{t.advisor_name ?? '-'}</td>
                                        <td className="px-4 py-3 text-xs text-text-muted dark:text-dark-text-muted">{t.degree_name ?? '-'}</td>
                                        <td className="px-4 py-3 text-center">
                                            {t.handle_url ? (
                                                <a href={t.handle_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent dark:text-dark-accent hover:underline">
                                                    <ExternalLink size={12} />
                                                    Ver
                                                </a>
                                            ) : (
                                                <span className="text-xs text-text-muted dark:text-dark-text-muted italic">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-bg-surface dark:bg-dark-bg-surface border-t border-border dark:border-dark-border gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-text-secondary dark:text-dark-text-secondary">Mostrar</span>
                            <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value)); setOffset(0); }} className="text-sm border border-border dark:border-dark-border rounded-md px-2 py-1 bg-bg-surface dark:bg-dark-bg-surface text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus">
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                            <span className="text-sm text-text-secondary dark:text-dark-text-secondary">tesis a la vez</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-text-muted dark:text-dark-text-muted">
                                Mostrando {theses.length > 0 ? offset + 1 : 0} - {Math.min(offset + limit, total)} de {total}
                            </span>
                            <div className="flex gap-1">
                                <button onClick={() => setOffset(offset - limit)} disabled={offset === 0} className="px-3 py-1 rounded border border-border dark:border-dark-border text-sm font-medium text-text-secondary dark:text-dark-text-secondary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
                                <div className="px-3 py-1 text-sm text-text-primary dark:text-dark-text-primary bg-bg-surface-alt dark:bg-dark-bg-surface-alt font-semibold rounded">{currentPage} de {totalPages}</div>
                                <button onClick={() => setOffset(offset + limit)} disabled={offset + limit >= total} className="px-3 py-1 rounded border border-border dark:border-dark-border text-sm font-medium text-text-secondary dark:text-dark-text-secondary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThesisExplorerPage;