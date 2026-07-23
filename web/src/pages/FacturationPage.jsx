import { useState, useEffect, useRef } from 'react';
import { Ship, Download, Anchor, Calendar, Search, AlertTriangle, Loader2, Link2, Unlink } from 'lucide-react';
import { useVesselSearch, usePortCalls, useAttachService } from '../hooks/useApi';
import { getApiBaseUrl } from '../services/api';

const fmtDate = (iso) => new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
const fmtTime = (iso) => new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

const STATUS_BADGE = {
  PLANIFIE: 'bg-blue-100 text-blue-700',
  EN_COURS: 'bg-emerald-100 text-emerald-700',
  TERMINE: 'bg-slate-200 text-slate-600',
  ANNULE: 'bg-red-100 text-red-700',
};

// Recherche intelligente de navires (autocomplétion sur la liste Portic)
function VesselSearch({ onSelect }) {
  const [input, setInput] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const { data: results, isFetching } = useVesselSearch(debounced);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(input), 250);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    const onClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={boxRef}>
      <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500">
        <Ship className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value.toUpperCase()); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher un navire (ex: GNV SEALAND)…"
          className="w-full outline-none text-sm"
        />
        {isFetching && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      </div>
      {open && results?.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg text-sm">
          {results.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => { onSelect(name); setInput(name); setOpen(false); }}
                className="w-full text-left px-3 py-2 hover:bg-blue-50"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && debounced.trim().length >= 2 && results?.length === 0 && !isFetching && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg text-sm px-3 py-2 text-slate-400">
          Aucun navire trouvé
        </div>
      )}
    </div>
  );
}

export default function FacturationPage() {
  const year = new Date().getFullYear();
  const [vessel, setVessel] = useState('');
  const [from, setFrom] = useState(`${year}-01-01`);
  const [to, setTo] = useState(`${year}-12-31`);
  const [query, setQuery] = useState(null);
  const [showEmpty, setShowEmpty] = useState(false);

  const { data, isFetching, error } = usePortCalls(query);
  const attach = useAttachService();

  const load = () => { if (vessel) setQuery({ vessel, from, to }); };

  const exportUrl = () => {
    const token = localStorage.getItem('token');
    const p = new URLSearchParams({ ...query, ...(token ? { token } : {}) });
    return `${getApiBaseUrl()}/facturation/export?${p.toString()}`;
  };

  const billable = data?.groups?.filter((g) => g.services.length > 0) || [];
  const empty = data?.groups?.filter((g) => g.services.length === 0) || [];
  const shown = showEmpty ? data?.groups || [] : billable;

  const doAttach = (serviceId, portCall) => attach.mutate({ serviceId, vessel: data.vessel.name, portCall });
  const doDetach = (serviceId) => attach.mutate({ serviceId, detach: true });

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

      <div className="bg-white border rounded-xl p-4 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[260px]">
          <label className="block text-sm font-medium text-slate-600 mb-1">Navire (buque)</label>
          <VesselSearch onSelect={setVessel} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Du</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Au</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={load} disabled={!vessel || isFetching} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
          {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Charger les escales
        </button>
      </div>

      {vessel && !query && (
        <p className="text-sm text-slate-500">Navire sélectionné : <strong>{vessel}</strong> — cliquez « Charger les escales ».</p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error.response?.data?.message || 'Erreur lors de la récupération des escales Portic.'}
        </div>
      )}

      {isFetching && !data && <p className="text-slate-400">Interrogation de Portic…</p>}

      {data && (
        <>
          <div className="bg-white border rounded-xl p-5">
            <div className="flex items-center gap-3 flex-wrap">
              <Anchor className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-lg">{data.vessel.name}</span>
              <span className="text-slate-300">·</span>
              <span className="text-sm text-slate-600">Consignataire : {data.vessel.consignatari || '—'}</span>
              <span className="text-slate-300">·</span>
              <span className="text-sm text-slate-600">Armateur : {data.vessel.armador || '—'}</span>
            </div>
            <div className="mt-2 text-sm text-slate-500">
              {billable.length} groupe{billable.length > 1 ? 's' : ''} facturable{billable.length > 1 ? 's' : ''}
              {' · '}{data.totalEscalas} escale(s) trouvée(s) chez Portic
              {empty.length > 0 && (
                <button onClick={() => setShowEmpty((v) => !v)} className="ml-2 text-blue-600 hover:underline">
                  {showEmpty ? 'masquer' : 'afficher'} les {empty.length} escale(s) sans prestation
                </button>
              )}
            </div>
          </div>

          {shown.length === 0 && <p className="text-slate-400">Aucune escale avec prestations sur la période.</p>}

          {shown.map((g, i) => (
            <div key={i} className="bg-white border rounded-xl overflow-hidden">
              <div className="bg-slate-50 border-b px-5 py-3 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 text-sm">
                  {g.groupId && (
                    <span className="px-2 py-1 rounded-md bg-blue-600 text-white font-mono font-bold text-xs">{g.groupId}</span>
                  )}
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold">
                    {fmtDate(g.portCall.eta)} {fmtTime(g.portCall.eta)} → {fmtDate(g.portCall.etd)} {fmtTime(g.portCall.etd)}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-600">Muelle {g.portCall.muelle || '—'}</span>
                </div>
                <span className="text-sm font-medium text-slate-600">
                  {g.services.length} prestation{g.services.length > 1 ? 's' : ''}
                </span>
              </div>
              {g.services.length > 0 && (
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
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {g.services.map((s) => (
                        <tr key={s.id}>
                          <td className="px-4 py-2 font-mono text-slate-500">{s.serviceCode}</td>
                          <td className="px-4 py-2">{fmtDate(s.startTime)} {fmtTime(s.startTime)}</td>
                          <td className="px-4 py-2"><span className="font-mono text-slate-400 mr-1">{s.driverCode}</span>{s.driverName}</td>
                          <td className="px-4 py-2">{s.title || '—'}</td>
                          <td className="px-4 py-2 text-slate-500 text-xs">{s.pickup || '?'} → {s.dropoff || '?'}</td>
                          <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[s.status] || ''}`}>{s.status}</span></td>
                          <td className="px-4 py-2 text-right">
                            {s.groupId && (
                              <button onClick={() => doDetach(s.id)} title="Détacher (rattachement manuel)" className="text-slate-400 hover:text-red-600 inline-flex items-center gap-1 text-xs">
                                <Unlink className="w-3.5 h-3.5" /> rattaché
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          {/* Prestations hors escale : à rattacher manuellement */}
          {data.unmatched?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                {data.unmatched.length} prestation(s) hors escale
              </h3>
              <p className="text-sm text-amber-700 mb-3">
                Prestations pour ce navire ne tombant dans aucune fenêtre d'escale (ex : équipage récupéré
                à l'aéroport avant l'arrivée du bateau). Rattachez-les au bon groupe de facturation :
              </p>
              <div className="space-y-2">
                {data.unmatched.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 flex-wrap bg-white rounded-lg border border-amber-200 px-3 py-2">
                    <span className="font-mono text-slate-500 text-sm">{s.serviceCode}</span>
                    <span className="text-sm">{fmtDate(s.startTime)} {fmtTime(s.startTime)}</span>
                    <span className="text-sm text-slate-600">{s.title || '—'}</span>
                    <span className="text-xs text-slate-400">({s.driverCode})</span>
                    <div className="ml-auto flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-amber-600" />
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const idx = Number(e.target.value);
                          if (!Number.isNaN(idx) && data.groups[idx]) doAttach(s.id, data.groups[idx].portCall);
                          e.target.value = '';
                        }}
                        className="text-sm border border-slate-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 max-w-[300px]"
                      >
                        <option value="">Rattacher à une escale…</option>
                        {data.groups.map((g, idx) => (
                          <option key={idx} value={idx}>
                            {g.groupId ? `${g.groupId} · ` : ''}{fmtDate(g.portCall.eta)} {fmtTime(g.portCall.eta)} · Muelle {g.portCall.muelle || '—'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!query && !vessel && (
        <p className="text-slate-400 text-sm">
          Recherchez un navire par son nom (liste Portic), choisissez une période, puis « Charger les escales ».
          Chaque escale (arrivée → départ) devient un groupe de facturation identifié (ex :{' '}
          <code>{`${String(year).slice(2)}BCN001`}</code>), avec ses prestations. Les prestations hors escale
          peuvent être rattachées manuellement à un groupe.
        </p>
      )}
    </div>
  );
}
