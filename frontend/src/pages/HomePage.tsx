import { User, GraduationCap, BookOpen, FileText, Users, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import type { DbStats } from '../types/student';
import { useState, useEffect } from 'react';
import { getStats } from '../api/statsApi';

const PIE_COLORS = ['#5B8DEF', '#3D8B5E'];

export default function HomePage() {
	const { user } = useAuth();

	if (!user) return null;

	//const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [stats, setStats] = useState<DbStats>();

	useEffect(() => {
		setLoading(true);
		getStats()
			.then((res) => {
				setStats(res);
			})
			.catch(() => {
				//setError(err.message);
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	// Chart data derived from DB stats
	const barData = stats ? [
		{ name: 'Profesores', value: stats.advisors, fill: '#4F6D7A' },
		{ name: 'Tesis', value: stats.theses, fill: '#5B8DEF' },
		{ name: 'Publicaciones', value: stats.publications, fill: '#3D8B5E' },
	] : [];

	const pieData = stats ? [
		{ name: 'Tesis', value: stats.theses },
		{ name: 'Publicaciones', value: stats.publications },
	] : [];

	const infoRows = [
		{ label: 'Codigo', value: user.estudiante.codigo_matricula, icon: GraduationCap },
		{ label: 'Facultad', value: user.estudiante.facultad, icon: BookOpen },
		{ label: 'Programa', value: user.estudiante.escuela, icon: FileText },
		{ label: 'Plan', value: user.estudiante.plan, icon: Calendar },
	];

	return (
		<div className="mx-auto max-w-7xl">
			<div className="grid gap-8 lg:grid-cols-3">
				{/* Left: Student card */}
				<div className="lg:col-span-1">
					<div className="rounded-2xl border border-border bg-bg-surface p-6 dark:border-dark-border dark:bg-dark-bg-surface">
						{/* Profile header */}
						<div className="mb-5 flex items-center gap-4">
							<div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent dark:bg-dark-accent/10 dark:text-dark-accent">
								<User className="h-7 w-7" />
							</div>
							<div>
								<h2 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">
									{user.estudiante.nombres_apellidos}
								</h2>
								<p className="text-xs text-text-muted dark:text-dark-text-muted">Estudiante</p>
							</div>
						</div>

						{/* Info rows */}
						<div className="space-y-3">
							{infoRows.map(({ label, value, icon: Icon }) => (
								<div key={label} className="flex items-start gap-3">
									<Icon className="mt-0.5 h-4 w-4 shrink-0 text-text-muted dark:text-dark-text-muted" />
									<div>
										<p className="text-[11px] font-medium uppercase tracking-wide text-text-muted dark:text-dark-text-muted">
											{label}
										</p>
										<p className="text-sm text-text-primary dark:text-dark-text-primary">{value}</p>
									</div>
								</div>
							))}
						</div>

						{/* GPA badge */}
						<div className="mt-5 rounded-xl bg-accent/5 px-4 py-3 dark:bg-dark-accent/10">
							<p className="text-xs font-medium text-text-muted dark:text-dark-text-muted">Promedio Ponderado</p>
							<p className="text-2xl font-bold text-accent dark:text-dark-accent">
								{user.resumen_creditos.promedio_ponderado}
							</p>
						</div>
					</div>
				</div>

				{/* Right: Stats + dashboard */}
				<div className="space-y-6 lg:col-span-2">
					{loading || !stats ? (
						<div className="flex h-full min-h-75 items-center justify-center rounded-2xl border border-border bg-bg-surface p-6 dark:border-dark-border dark:bg-dark-bg-surface">
							<div className="flex flex-col items-center gap-3">
								<div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent dark:border-dark-accent dark:border-r-transparent"></div>
								<p className="text-sm text-text-muted dark:text-dark-text-muted">Cargando estadísticas...</p>
							</div>
						</div>
					) : (
						<>
							{/* Stats cards */}
							<div>
								<h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted dark:text-dark-text-muted">
									Cifras actuales de la fuente de datos
								</h3>
								<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
									{[
										{ label: 'Profesores', value: stats.advisors, icon: Users },
										{ label: 'Tesis', value: stats.theses, icon: BookOpen },
										{ label: 'Publicaciones', value: stats.publications, icon: FileText },
										{ label: 'Rango', value: `${stats.range_start}-${stats.range_end}`, icon: Calendar },
									].map(({ label, value, icon: Icon }) => (
										<div
											key={label}
											className="rounded-xl border border-border bg-bg-surface p-4 dark:border-dark-border dark:bg-dark-bg-surface"
										>
											<Icon className="mb-2 h-4.5 w-4.5 text-accent dark:text-dark-accent" />
											<p className="text-xl font-bold text-text-primary dark:text-dark-text-primary">{value}</p>
											<p className="text-xs text-text-muted dark:text-dark-text-muted">{label}</p>
										</div>
									))}
								</div>
							</div>

							{/* Charts */}
							<div className="grid gap-5 md:grid-cols-2">
								{/* Bar chart */}
								<div className="rounded-2xl border border-border bg-bg-surface p-5 dark:border-dark-border dark:bg-dark-bg-surface">
									<h4 className="mb-4 text-sm font-semibold text-text-primary dark:text-dark-text-primary">
										Datos por categoria
									</h4>
									<ResponsiveContainer width="100%" height={200}>
										<BarChart data={barData}>
											<XAxis
												dataKey="name"
												tick={{ fontSize: 11, fill: '#8E8E9E' }}
												axisLine={false}
												tickLine={false}
											/>
											<YAxis hide />
											<Tooltip
												contentStyle={{
													background: 'var(--color-bg-surface)',
													border: '1px solid var(--color-border)',
													borderRadius: '8px',
													fontSize: '12px',
												}}
											/>
											<Bar dataKey="value" radius={[6, 6, 0, 0]} />
										</BarChart>
									</ResponsiveContainer>
								</div>

								{/* Pie chart */}
								<div className="rounded-2xl border border-border bg-bg-surface p-5 dark:border-dark-border dark:bg-dark-bg-surface">
									<h4 className="mb-4 text-sm font-semibold text-text-primary dark:text-dark-text-primary">
										Distribucion de produccion academica
									</h4>
									<ResponsiveContainer width="100%" height={200}>
										<PieChart>
											<Pie
												data={pieData}
												cx="50%"
												cy="50%"
												innerRadius={50}
												outerRadius={80}
												paddingAngle={4}
												dataKey="value"
											>
												{pieData.map((_, idx) => (
													<Cell key={idx} fill={PIE_COLORS[idx]} />
												))}
											</Pie>
											<Tooltip
												contentStyle={{
													background: 'var(--color-bg-surface)',
													border: '1px solid var(--color-border)',
													borderRadius: '8px',
													fontSize: '12px',
												}}
											/>
										</PieChart>
									</ResponsiveContainer>
									<div className="mt-2 flex justify-center gap-6">
										{pieData.map((entry, idx) => (
											<div key={entry.name} className="flex items-center gap-2 text-xs text-text-secondary dark:text-dark-text-secondary">
												<div className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[idx] }} />
												{entry.name}
											</div>
										))}
									</div>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
