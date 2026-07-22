import { NavLink, useNavigate } from 'react-router-dom';
import { Calendar, Users, BarChart3, Settings, Building2, Car, LogOut, FileSpreadsheet, CalendarClock, Ship } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { path: '/planning', label: 'Planning', icon: Calendar },
  { path: '/personnel', label: 'Personnel', icon: Users },
  { path: '/clients', label: 'Clients', icon: Building2 },
  { path: '/roster', label: 'Jours de travail', icon: CalendarClock },
  { path: '/facturation', label: 'Facturation', icon: Ship },
  { path: '/stats', label: 'Statistiques', icon: BarChart3 },
  { path: '/settings', label: 'Paramètres', icon: Settings },
];

const futureModules = [
  { label: 'Maintenance', icon: Car },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'OP';

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen flex flex-col shrink-0">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Car className="w-6 h-6" />
          Planning Transport
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}

        <div className="mt-8 pt-4 border-t border-slate-700">
          <p className="px-4 text-xs text-slate-500 uppercase font-semibold mb-2">Modules futurs</p>
          {futureModules.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 cursor-not-allowed"
              title="Bientôt disponible"
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
            {initials}
          </div>
          <div className="text-sm flex-1 min-w-0">
            <p className="font-medium truncate">
              {user ? `${user.firstName} ${user.lastName}` : 'Opérateur'}
            </p>
            <p className="text-slate-400 text-xs">{user?.codeId ?? 'OP-001'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            title="Se déconnecter"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
