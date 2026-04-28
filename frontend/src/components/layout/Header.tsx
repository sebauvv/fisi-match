import { Sun, Moon, User, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
	onToggleSidebar: () => void;
	onOpenThesisModal?: () => void;
}

export default function Header({ onToggleSidebar, onOpenThesisModal }: HeaderProps) {
	const { isDark, toggleTheme } = useTheme();
	const { logout } = useAuth();
	const navigate = useNavigate();
	const [showMenu, setShowMenu] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	// Closes the dropdown when clicking outside
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setShowMenu(false);
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, []);

	const handleLogout = () => {
		logout();
		navigate('/login');
	};

	return (
		<header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-bg-surface/80 px-4 backdrop-blur-md sm:px-6 dark:border-dark-border dark:bg-dark-bg-surface/80">
			{/* Left: hamburger + app name */}
			<div className="flex items-center gap-3">
				<button
					onClick={onToggleSidebar}
					className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-hover dark:text-dark-text-secondary dark:hover:bg-dark-bg-hover"
					aria-label="Menu"
				>
					<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
				<span className="text-lg font-bold tracking-tight text-text-primary dark:text-dark-text-primary cursor-pointer" onClick={() => navigate('/home')}>
					FISI Match
				</span>
			</div>

			{/* Warning Banner Contextualized */}
			{!useAuth().user?.thesis_idea && (
				<button
					onClick={onOpenThesisModal}
					className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium hover:bg-yellow-500/20 border border-yellow-500/20 transition-colors whitespace-nowrap"
				>
					<span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse hidden sm:block"></span>
					Insertar idea de tesis
				</button>
			)}

			{/* Right: theme toggle + profile */}
			<div className="flex items-center gap-2">
				{/* Dark mode toggle */}
				<button
					onClick={toggleTheme}
					className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-hover dark:text-dark-text-secondary dark:hover:bg-dark-bg-hover"
					aria-label="Cambiar tema"
				>
					{isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
				</button>

				{/* Profile dropdown */}
				<div className="relative" ref={menuRef}>
					<button
						onClick={() => setShowMenu(!showMenu)}
						className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-text-secondary transition-colors hover:bg-bg-hover dark:text-dark-text-secondary dark:hover:bg-dark-bg-hover"
					>
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent dark:bg-dark-accent/10 dark:text-dark-accent">
							<User className="h-4 w-4" />
						</div>
						<ChevronDown className="h-3.5 w-3.5" />
					</button>

					{showMenu && (
						<div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-bg-surface py-1 shadow-xl dark:border-dark-border dark:bg-dark-bg-surface">
							<button
								onClick={() => { setShowMenu(false); navigate('/profile'); }}
								className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-bg-hover dark:text-dark-text-primary dark:hover:bg-dark-bg-hover"
							>
								<User className="h-4 w-4 text-text-muted dark:text-dark-text-muted" />
								Ver Perfil
							</button>
							<button
								onClick={handleLogout}
								className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-error transition-colors hover:bg-bg-hover dark:text-dark-error dark:hover:bg-dark-bg-hover"
							>
								<LogOut className="h-4 w-4" />
								Cerrar Sesion
							</button>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
