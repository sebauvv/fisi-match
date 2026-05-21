import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import AdvisorExplorerPage from './pages/AdvisorExplorerPage';
import AdvisorProfilePage from './pages/AdvisorProfilePage';
import AdvisorRecommendationPage from './pages/AdvisorRecommendationPage';
import AlignmentEvaluatorPage from './pages/AlignmentEvaluatorPage';
import AlternativeRecommenderPage from './pages/AlternativeRecommenderPage';
import ProfilePage from './pages/ProfilePage';
import ThesisExplorerPage from './pages/ThesisExplorerPage';
import PublicationExplorerPage from './pages/PublicationExplorerPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes with layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<HomePage />} />
          <Route path="/explorador-profesores" element={<AdvisorExplorerPage />} />
          <Route path="/explorador-profesores/:id" element={<AdvisorProfilePage />} />
          <Route path="/recomendacion-asesor" element={<AdvisorRecommendationPage />} />
          <Route path="/reporte-alineamiento" element={<AlignmentEvaluatorPage />} />
          <Route path="/temas-alternativos" element={<AlternativeRecommenderPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/explorador-tesis" element={<ThesisExplorerPage />} />
          <Route path="/explorador-articulos" element={<PublicationExplorerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
