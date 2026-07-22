import { useAuth } from '../context/AuthContext';
import { User, Shield, Server, Info } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      <section className="bg-white rounded-xl shadow border p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-blue-500" /> Compte connecté
        </h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Nom</dt>
            <dd className="font-medium">{user ? `${user.firstName} ${user.lastName}` : '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Identifiant</dt>
            <dd className="font-mono">{user?.codeId}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Rôle</dt>
            <dd>{user?.role}</dd>
          </div>
        </dl>
      </section>

      <section className="bg-white rounded-xl shadow border p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-green-500" /> Application
        </h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Version</dt>
            <dd className="font-medium">2.1.0</dd>
          </div>
          <div>
            <dt className="text-slate-500">API</dt>
            <dd className="font-mono text-xs">{import.meta.env.VITE_API_URL || '/api/v1'}</dd>
          </div>
        </dl>
      </section>

      <section className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-2 text-blue-900">
          <Shield className="w-5 h-5" /> Sécurité
        </h2>
        <p className="text-sm text-blue-800 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          Les codes PIN sont chiffrés (bcrypt) et ne sont jamais renvoyés par l'API. Toutes les
          modifications de planning et de personnel sont tracées dans le journal d'audit.
        </p>
      </section>
    </div>
  );
}
