import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Download, Calendar, ListChecks, PlayCircle, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useStats, useDriverStats } from '../hooks/useApi';
import { getApiBaseUrl } from '../services/api';

const STATUS = {
  PLANIFIE: { label: 'Planifié', color: '#3B82F6' },
  EN_COURS: { label: 'En cours', color: '#10B981' },
  TERMINE: { label: 'Terminé', color: '#64748B' },
  ANNULE: { label: 'Annulé', color: '#EF4444' },
};

export default function StatsPage() {
  const [period, setPeriod] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data: stats, isLoading } = useStats(period);
  const { data: byDriver } = useDriverStats(period);

  const buildExportUrl = (type) => {
    const token = localStorage.getItem('token');
    const base = getApiBaseUrl();
    const params = new URLSearchParams({
      start_date: period.startDate,
      end_date: period.endDate,
      ...(token ? { token } : {}),
    });
    return `${base}/exports/${type}?${params.toString()}`;
  };

  const statusData = stats?.services_by_status
    ? Object.entries(stats.services_by_status).map(([key, value]) => ({
        name: STATUS[key]?.label || key,
        key,
        value,
      }))
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Statistiques & Exports</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input type="date" value={period.startDate} onChange={(e) => setPeriod({ ...period, startDate: e.target.value })} className="border-none outline-none text-sm bg-transparent" />
            <span className="text-slate-400">→</span>
            <input type="date" value={period.endDate} onChange={(e) => setPeriod({ ...period, endDate: e.target.value })} className="border-none outline-none text-sm bg-transparent" />
          </div>
          <a href={buildExportUrl('excel')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Download className="w-4 h-4" /> Excel
          </a>
          <a href={buildExportUrl('csv')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800">
            <FileText className="w-4 h-4" /> CSV
          </a>
        </div>
      </div>

      {isLoading ? (
        <p className="text-slate-400">Chargement...</p>
      ) : (
        <>
          {/* KPIs opérationnels */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard label="Total services" value={stats?.total_services ?? 0} icon={ListChecks} color="text-blue-500" />
            <KpiCard label="En cours" value={stats?.services_in_progress ?? 0} icon={PlayCircle} color="text-emerald-500" />
            <KpiCard label="Terminés" value={stats?.services_done ?? 0} icon={CheckCircle2} color="text-slate-500" />
            <KpiCard label="Annulés" value={stats?.services_cancelled ?? 0} icon={XCircle} color="text-red-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Répartition par statut */}
            <div className="bg-white p-6 rounded-xl shadow border">
              <h3 className="font-semibold mb-4">Répartition par statut</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">
                    {statusData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS[entry.key]?.color || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Services par chauffeur (terminés vs annulés) */}
            <div className="bg-white p-6 rounded-xl shadow border">
              <h3 className="font-semibold mb-4">Terminés / Annulés par chauffeur</h3>
              {byDriver?.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={byDriver} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="chauffeur_code" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="termine" name="Terminés" stackId="a" fill={STATUS.TERMINE.color} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="en_cours" name="En cours" stackId="a" fill={STATUS.EN_COURS.color} />
                    <Bar dataKey="planifie" name="Planifiés" stackId="a" fill={STATUS.PLANIFIE.color} />
                    <Bar dataKey="annule" name="Annulés" stackId="a" fill={STATUS.ANNULE.color} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-center py-16">Aucune donnée sur la période</p>
              )}
            </div>
          </div>

          {/* Tableau récapitulatif par chauffeur */}
          <div className="bg-white rounded-xl shadow border overflow-hidden">
            <h3 className="font-semibold p-4 border-b">Récapitulatif par chauffeur</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Chauffeur</th>
                    <th className="px-4 py-3 font-medium text-center">Total</th>
                    <th className="px-4 py-3 font-medium text-center">Planifiés</th>
                    <th className="px-4 py-3 font-medium text-center">En cours</th>
                    <th className="px-4 py-3 font-medium text-center">Terminés</th>
                    <th className="px-4 py-3 font-medium text-center">Annulés</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {byDriver?.map((d) => (
                    <tr key={d.chauffeur_id} className={d.is_active ? '' : 'opacity-50'}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-slate-500 mr-2">{d.chauffeur_code}</span>
                        {d.chauffeur_name}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">{d.total}</td>
                      <td className="px-4 py-3 text-center text-blue-600">{d.planifie}</td>
                      <td className="px-4 py-3 text-center text-emerald-600">{d.en_cours}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{d.termine}</td>
                      <td className="px-4 py-3 text-center text-red-600">{d.annule}</td>
                    </tr>
                  ))}
                  {!byDriver?.length && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Aucune donnée</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </div>
  );
}
