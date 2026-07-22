import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import PlanningPage from './pages/PlanningPage';
import PersonnelPage from './pages/PersonnelPage';
import ClientsPage from './pages/ClientsPage';
import RosterPage from './pages/RosterPage';
import FacturationPage from './pages/FacturationPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/planning" element={<PlanningPage />} />
        <Route path="/personnel" element={<PersonnelPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/roster" element={<RosterPage />} />
        <Route path="/facturation" element={<FacturationPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/" element={<Navigate to="/planning" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/planning" replace />} />
    </Routes>
  );
}
