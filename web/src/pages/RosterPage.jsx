import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Wand2, AlertTriangle, CalendarClock, Users2 } from 'lucide-react';
import { useRoster, useGenerateRoster, useUpdateRosterEntry } from '../hooks/useApi';
import ProfilesModal from '../components/Roster/ProfilesModal';

const SHIFT_STYLE = {
  JOUR: 'bg-blue-500 text-white',
  SOIR: 'bg-indigo-500 text-white',
  REPOS: 'bg-slate-100 text-slate-400',
};
const SHIFT_SHORT = { JOUR: 'J', SOIR: 'S', REPOS: '·' };
const NEXT = { JOUR: 'SOIR', SOIR: 'REPOS', REPOS: 'JOUR' };
const WEEKDAY = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export default function RosterPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [showProfiles, setShowProfiles] = useState(false);
  const { data: roster, isLoading } = useRoster(month);
  const generate = useGenerateRoster();
  const updateEntry = useUpdateRosterEntry();

  const days = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const n = new Date(y, m, 0).getDate();
    return Array.from({ length: n }, (_, i) => {
      const dt = new Date(y, m - 1, i + 1);
      const dow = dt.getDay();
      return {
        day: i + 1,
        date: `${y}-${String(m).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
        dow,
        isWeekend: dow === 0 || dow === 6,
      };
    });
  }, [month]);

  const entryMap = useMemo(() => {
    const map = {};
    roster?.entries?.forEach((e) => (map[`${e.personnelId}:${e.date}`] = e));
    return map;
  }, [roster]);

  const shifts = roster?.shifts || [];

  // Couverture par jour et par shift
  const coverage = useMemo(() => {
    const cov = {};
    days.forEach((d) => {
      cov[d.date] = {};
      shifts.forEach((s) => {
        cov[d.date][s.key] = roster?.entries?.filter((e) => e.date === d.date && e.shift === s.key).length || 0;
      });
    });
    return cov;
  }, [days, shifts, roster]);

  const cycleCell = (driverId, date) => {
    const cur = entryMap[`${driverId}:${date}`]?.shift || 'REPOS';
    updateEntry.mutate({ month, personnelId: driverId, date, shift: NEXT[cur] });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarClock className="w-6 h-6 text-blue-600" /> Jours de travail
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-white border rounded-lg px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={() => setShowProfiles(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
          >
            <Users2 className="w-4 h-4" />
            Chauffeurs
          </button>
          <button
            onClick={() => generate.mutate({ month })}
            disabled={generate.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            <Wand2 className="w-4 h-4" />
            {generate.isPending ? 'Génération...' : 'Générer le planning'}
          </button>
        </div>
      </div>

      {/* Légende + règles */}
      <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
        {shifts.map((s) => (
          <span key={s.key} className="flex items-center gap-1">
            <span className={`w-4 h-4 rounded-sm ${SHIFT_STYLE[s.key]}`} />
            {s.label} ({s.start}–{s.end}, min {s.min})
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className={`w-4 h-4 rounded-sm ${SHIFT_STYLE.REPOS}`} /> Repos
        </span>
        <span className="text-slate-400">· cliquez une case pour changer (Jour → Soir → Repos)</span>
      </div>

      {isLoading || !roster ? (
        <p className="text-slate-400">Chargement...</p>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow border overflow-x-auto">
            <table className="text-xs border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-slate-50 z-10 px-3 py-2 text-left font-medium text-slate-500 border-b min-w-[150px]">
                    Chauffeur
                  </th>
                  {days.map((d) => (
                    <th
                      key={d.date}
                      className={`px-1 py-1 text-center font-medium border-b ${d.isWeekend ? 'bg-amber-50 text-amber-700' : 'text-slate-500'}`}
                    >
                      <div>{WEEKDAY[d.dow]}</div>
                      <div>{d.day}</div>
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center font-medium text-slate-500 border-b border-l">Tot.</th>
                </tr>
              </thead>
              <tbody>
                {roster.drivers.map((drv) => {
                  const st = roster.stats?.find((s) => s.personnelId === drv.id);
                  return (
                    <tr key={drv.id}>
                      <td className="sticky left-0 bg-white z-10 px-3 py-1 border-b whitespace-nowrap">
                        <span className="font-mono text-slate-400 mr-1">{drv.codeId}</span>
                        {drv.name}
                      </td>
                      {days.map((d) => {
                        const e = entryMap[`${drv.id}:${d.date}`];
                        const shift = e?.shift || 'REPOS';
                        return (
                          <td key={d.date} className={`p-0.5 border-b text-center ${d.isWeekend ? 'bg-amber-50/40' : ''}`}>
                            <button
                              onClick={() => cycleCell(drv.id, d.date)}
                              title={`${drv.name} — ${d.date} — ${shift}${e?.locked ? ' (modifié)' : ''}`}
                              className={`w-6 h-6 rounded ${SHIFT_STYLE[shift]} font-bold relative hover:ring-2 hover:ring-blue-400`}
                            >
                              {SHIFT_SHORT[shift]}
                              {e?.locked && <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full" />}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-2 py-1 border-b border-l text-center font-semibold">
                        {st?.shifts ?? 0}
                        <span className="text-slate-400 font-normal"> ({st?.weekend ?? 0}we)</span>
                      </td>
                    </tr>
                  );
                })}

                {/* Couverture par shift */}
                {shifts.map((s) => (
                  <tr key={s.key} className="bg-slate-50">
                    <td className="sticky left-0 bg-slate-50 z-10 px-3 py-1 text-slate-500 border-t whitespace-nowrap">
                      Couverture {s.label}
                    </td>
                    {days.map((d) => {
                      const n = coverage[d.date]?.[s.key] ?? 0;
                      const under = n < s.min;
                      return (
                        <td
                          key={d.date}
                          className={`px-1 py-1 text-center border-t font-semibold ${under ? 'bg-red-100 text-red-600' : 'text-slate-500'}`}
                          title={under ? `Sous-effectif : ${n}/${s.min}` : `${n}/${s.min}`}
                        >
                          {n}
                        </td>
                      );
                    })}
                    <td className="border-t border-l" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Avertissements */}
          {roster.warnings?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                {roster.warnings.length} point{roster.warnings.length > 1 ? 's' : ''} d'attention
              </h3>
              <ul className="text-sm text-amber-700 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 max-h-48 overflow-y-auto">
                {roster.warnings.map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {showProfiles && (
        <ProfilesModal
          onClose={() => setShowProfiles(false)}
          onSaved={() => generate.mutate({ month })}
        />
      )}
    </div>
  );
}
