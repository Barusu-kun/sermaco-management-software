import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useRosterProfiles, useSaveRosterProfile } from '../../hooks/useApi';

const DAYS = [
  { dow: 1, label: 'L' },
  { dow: 2, label: 'M' },
  { dow: 3, label: 'M' },
  { dow: 4, label: 'J' },
  { dow: 5, label: 'V' },
  { dow: 6, label: 'S' },
  { dow: 0, label: 'D' },
];

export default function ProfilesModal({ onClose, onSaved }) {
  const { data, isLoading } = useRosterProfiles();
  const save = useSaveRosterProfile();
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.profiles) setRows(data.profiles.map((p) => ({ ...p, profile: { ...p.profile } })));
  }, [data]);

  const shifts = data?.shifts || [];

  const patch = (id, changes) =>
    setRows((rs) => rs.map((r) => (r.personnelId === id ? { ...r, profile: { ...r.profile, ...changes } } : r)));

  const toggleDay = (id, dow) => {
    setRows((rs) =>
      rs.map((r) => {
        if (r.personnelId !== id) return r;
        const days = new Set(r.profile.fixedDays || []);
        days.has(dow) ? days.delete(dow) : days.add(dow);
        return { ...r, profile: { ...r.profile, fixedDays: [...days].sort() } };
      })
    );
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await Promise.all(rows.map((r) => save.mutateAsync({ personnelId: r.personnelId, profile: r.profile })));
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Profils des chauffeurs</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {isLoading ? (
          <p className="p-6 text-slate-400">Chargement...</p>
        ) : (
          <div className="p-6 space-y-3">
            <p className="text-sm text-slate-500">
              Définissez le fonctionnement de chaque chauffeur. « Fixe » = planning imposé (ex : uniquement
              Jour, du lundi au vendredi). « Rotatif » = réparti automatiquement en tournant les shifts.
            </p>
            {rows.map((r) => (
              <div key={r.personnelId} className="border rounded-lg p-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-medium min-w-[160px]">
                    <span className="font-mono text-slate-400 mr-1">{r.codeId}</span>{r.name}
                  </span>

                  <select
                    value={r.profile.mode}
                    onChange={(e) => patch(r.personnelId, { mode: e.target.value })}
                    className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ROTATING">Rotatif</option>
                    <option value="FIXED">Fixe</option>
                  </select>

                  {r.profile.mode === 'FIXED' && (
                    <>
                      <select
                        value={r.profile.fixedShift || ''}
                        onChange={(e) => patch(r.personnelId, { fixedShift: e.target.value })}
                        className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Shift…</option>
                        {shifts.map((s) => (
                          <option key={s.key} value={s.key}>{s.label} ({s.start}–{s.end})</option>
                        ))}
                      </select>
                      <div className="flex gap-1">
                        {DAYS.map((d, i) => {
                          const on = (r.profile.fixedDays || []).includes(d.dow);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => toggleDay(r.personnelId, d.dow)}
                              className={`w-7 h-7 rounded text-xs font-bold ${on ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <label className="flex items-center gap-1.5 text-sm text-slate-600 ml-auto">
                    <input
                      type="checkbox"
                      checked={!!r.profile.weekendOff}
                      onChange={(e) => patch(r.personnelId, { weekendOff: e.target.checked })}
                    />
                    Week-end off garanti
                  </label>

                  <label className="flex items-center gap-1.5 text-sm text-slate-600">
                    Max/mois
                    <input
                      type="number"
                      min="0"
                      value={r.profile.maxPerMonth ?? ''}
                      onChange={(e) => patch(r.personnelId, { maxPerMonth: e.target.value === '' ? null : Number(e.target.value) })}
                      placeholder="∞"
                      className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 p-6 border-t sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
          <button onClick={saveAll} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Enregistrer & régénérer
          </button>
        </div>
      </div>
    </div>
  );
}
