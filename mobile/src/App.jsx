import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AgendaPage from './pages/AgendaPage';

function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/agenda" element={<RequireAuth><AgendaPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/agenda" replace />} />
    </Routes>
  );
}
