import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Server, ChevronDown } from 'lucide-react';
import api, { getApiBaseUrl, setApiBaseUrl, isNativePlatform } from '../services/api';

export default function LoginPage() {
  const [codeId, setCodeId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());
  const [showServer, setShowServer] = useState(isNativePlatform());
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (isNativePlatform() && !serverUrl.trim()) {
      setError("Veuillez renseigner l'adresse du serveur");
      setShowServer(true);
      return;
    }
    setApiBaseUrl(serverUrl);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/driver-login', { codeId, pinCode: pin });
      localStorage.setItem('token', data.token);
      localStorage.setItem('driver', JSON.stringify(data.user));
      navigate('/agenda', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiant ou PIN incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
            <Car className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Planning Transport</h1>
          <p className="text-slate-400">Espace Chauffeur</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Identifiant</label>
            <input
              type="text"
              value={codeId}
              onChange={(e) => setCodeId(e.target.value.toUpperCase())}
              placeholder="CH-001"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none text-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Code PIN (si requis)</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="0000"
              maxLength={4}
              pattern="[0-9]*"
              inputMode="numeric"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none text-lg tracking-widest text-center"
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60 text-lg"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowServer((s) => !s)}
              className="w-full flex items-center justify-center gap-1 text-slate-400 text-sm py-2"
            >
              <Server className="w-4 h-4" />
              Serveur
              <ChevronDown className={`w-4 h-4 transition-transform ${showServer ? 'rotate-180' : ''}`} />
            </button>
            {showServer && (
              <div className="mt-1">
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="http://192.168.1.50:3000/api/v1"
                  autoCapitalize="off"
                  autoCorrect="off"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <p className="text-slate-500 text-xs mt-1 text-center">
                  Adresse de l'API, incluant <code>/api/v1</code>
                </p>
              </div>
            )}
          </div>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          Démo : <span className="text-slate-400">CH-001</span> / PIN{' '}
          <span className="text-slate-400">0000</span>
        </p>
      </div>
    </div>
  );
}
