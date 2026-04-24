import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import ThesisIdeaModal from '../ui/ThesisIdeaModal';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [showThesisModal, setShowThesisModal] = useState(false);
	const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

	const { user } = useAuth();
	const hasIdea = !!user?.thesis_idea;

	const handleShowToast = (type: 'success' | 'error', text: string) => {
		setToastMessage({ type, text });
		setTimeout(() => setToastMessage(null), 4000);
	};

	useEffect(() => {
		if (user && !hasIdea) {
			setShowThesisModal(true);
		}
	}, [hasIdea, user]);

	return (
		<div className="flex min-h-screen flex-col">
			<Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onOpenThesisModal={() => setShowThesisModal(true)} />
			<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
			<main className="flex-1 px-5 py-8 sm:px-8 lg:px-12 relative z-0">
				<Outlet />
			</main>

			{showThesisModal && (
				<ThesisIdeaModal
					onClose={() => setShowThesisModal(false)}
					onSuccess={() => {
						setShowThesisModal(false);
						handleShowToast('success', 'Idea de Tesis subida exitosamente');
					}}
					onError={(msg) => {
						handleShowToast('error', `Error: ${msg}`);
					}}
				/>
			)}

			{toastMessage && (
				<div
					className={`fixed top-20 left-1/2 -translate-x-1/2 z-100 px-5 py-2.5 rounded-xl shadow-lg border text-sm font-semibold transition-all animate-fade-in-up flex items-center gap-2 ${toastMessage.type === 'success'
							? 'bg-green-100/90 text-green-700 border-green-300 dark:bg-green-900/80 dark:border-green-800 dark:text-green-300 backdrop-blur-md'
							: 'bg-red-100/90 text-red-700 border-red-300 dark:bg-red-900/80 dark:border-red-800 dark:text-red-300 backdrop-blur-md'
						}`}
				>
					{toastMessage.type === 'success' ? (
						<svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
					) : (
						<svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
					)}
					{toastMessage.text}
				</div>
			)}
		</div>
	);
}
