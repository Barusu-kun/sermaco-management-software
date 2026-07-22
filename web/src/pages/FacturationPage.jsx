import { useState } from 'react';
import { format, startOfMonth } from 'date-fns';
import { Ship, Download, Anchor, Calendar, Search, AlertTriangle, Loader2 } from 'lucide-react';
import { useClients, usePortCalls } from '../hooks/useApi';
import { getApiBaseUrl } from '../services/api';

const fmtDate = (iso) => new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
const fmtTime = (iso) => new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

const STATUS_BADGE = {
  PLANIFIE: 'bg-blue-100 text-blue-700',
  EN_COURS: 'bg-emerald-100 text-emerald-700',
  TERMINE: 'bg-slate-200 text-slate-600',
  ANNULE: 'bg-red-100 text-red-700',
};

export default function FacturationPage() {
  const { data: clients } = useClients({ isActive: true });
  const [form, setForm] = useState({
    clientId: '',
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });
  const [query, setQuery] = useState(null);
  const [showEmpty, setShowEmpty] = useState(false);

  const { data, isFetching, error } = usePortCalls(query);

  const load = () => {
    if (!form.clientId) return;
    setQuery({ ...form });
  };

  const exportUrl = () => {
    const token = localStorage.getItem('token');
    const p = new URLSearchParams({ ...query, ...(token ? { token } : {}) });
    return `${getApiBaseUrl()}/facturation/export?${p.toString()}`;
  };

  const billable = data?.groups?.filter((g) => g.services.length > 0) || [];
  const empty = data?.groups?.filter((g) => g.services.length === 0) || [];
  const shown = showEmpty ? data?.groups || [] : billable;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Ship className="w-6 h-6 text-blue-600" /> Facturation
        </h1>
        {query && data && (
          <a href={exportUrl()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Download className="w-4 h-4" /> Export Excel
          </a>
        )}
      </div>

      {/* Barre de recherche */}
      <div className="bg-white border rounded-xl p-4 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-sm font-medium text-slate-600 mb-1">Navire (buque)</label>
          <select
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sélectionner un navire...</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.imo ? ` (IMO ${c.imo})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Du</label>
          <input type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Au</label>
          <input type="date" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={load} disabled={!form.clientId || isFetching} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
          {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Charger les escales
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error.response?.data?.message || 'Erreur lors de la récupération des escales Portic.'}
        </div>
      )}

      {isFetching && !data && <p className="text-slate-400">Interrogation de Portic…</p>}

      {data && (
        <>
          {/* En-tête navire */}
          <div className="bg-white border rounded-xl p-5">
            <div className="flex items-center gap-3 flex-wrap">
              <Anchor className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-lg">{data.vessel.name}</span>
              {data.vessel.imo && <span className="text-sm text-slate-500">IMO {data.vessel.imo}</span>}
              <span className="text-slate-300">·</span>
              <span className="text-sm text-slate-600">Consignataire : {data.vessel.consignatari || '—'}</span>
              <span className="text-slate-300">·</span>
              <span className="text-sm text-slate-600">Armateur : {data.vessel.armador || '—'}</span>
            </div>
            <div className="mt-2 text-sm text-slate-500">
              {billable.length} escale{billable.length > 1 ? 's' : ''} facturable{billable.length > 1 ? 's' : ''}
              {' · '}{data.totalEscalas} escale(s) trouvée(s) chez Portic
              {empty.length > 0 && (
                <button onClick={() => setShowEmpty((v) => !v)} className="ml-2 text-blue-600 hover:underline">
                  {showEmpty ? 'masquer' : 'afficher'} les {empty.length} escale(s) sans prestation
                </button>
              )}
            </div>
          </div>

          {/* Groupes par escale */}
          {shown.length === 0 && <p className="text-slate-400">Aucune escale avec prestations sur la période.</p>}

          {shown.map((g, i) => (
            <div key={i} className="bg-white border rounded-xl overflow-hidden">
              <div className="bg-slate-50 border-b px-5 py-3 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold">
                    {fmtDate(g.portCall.eta)} {fmtTime(g.portCall.eta)} → {fmtDate(g.portCall.etd)} {fmtTime(g.portCall.etd)}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-600">Muelle {g.portCall.muelle || '—'}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">{g.portCall.tipo || ''}</span>
                </div>
                <span className="text-sm font-medium text-slate-600">
                  {g.services.length} prestation{g.services.length > 1 ? 's' : ''}
                </span>
              </div>
              {g.services.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-slate-500 text-left border-b">
                      <tr>
                        <th className="px-4 py-2 font-medium">N° Service</th>
                        <th className="px-4 py-2 font-medium">Date / heure</th>
                        <th className="px-4 py-2 font-medium">Chauffeur</th>
                        <th className="px-4 py-2 font-medium">Prestation</th>
                        <th className="px-4 py-2 font-medium">Trajet</th>
                        <th className="px-4 py-2 font-medium">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {g.services.map((s) => (
                        <tr key={s.id}>
                          <td className="px-4 py-2 font-mono text-slate-500">{s.serviceCode}</td>
                          <td className="px-4 py-2">{fmtDate(s.startTime)} {fmtTime(s.startTime)}</td>
                          <td className="px-4 py-2">
                            <span className="font-mono text-slate-400 mr-1">{s.driverCode}</span>{s.driverName}
                          </td>
                          <td className="px-4 py-2">{s.title || '—'}</td>
                          <td className="px-4 py-2 text-slate-500 text-xs">
                            {s.pickup || '?'}{s.stops?.map((st, k) => <span key={k}> ↳ {st}</span>)} → {s.dropoff || '?'}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[s.status] || ''}`}>{s.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-5 py-4 text-sm text-slate-400">Aucune prestation rattachée à cette escale.</p>
              )}
            </div>
          ))}

          {/* Prestations hors escale */}
          {data.unmatched?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                {data.unmatched.length} prestation(s) hors escale
              </h3>
              <p className="text-sm text-amber-700 mb-2">
                Ces prestations pour ce navire ne tombent dans aucune fenêtre d'escale Portic sur la période
                (à rattacher manuellement ou à vérifier).
              </p>
              <ul className="text-sm text-amber-800 space-y-1">
                {data.unmatched.map((s) => (
                  <li key={s.id}>• {s.serviceCode} — {fmtDate(s.startTime)} {fmtTime(s.startTime)} — {s.title || '—'} ({s.driverCode})</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {!query && (
        <p className="text-slate-400 text-sm">
          Sélectionnez un navire et une période, puis « Charger les escales » : les fenêtres d'escale
          (arrivée → départ) sont récupérées depuis Portic et les prestations sont regroupées par escale.
        </p>
      )}
    </div>
  );
}
