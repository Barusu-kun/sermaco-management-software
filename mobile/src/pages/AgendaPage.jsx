import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MapPin, Clock, Check, Navigation, ChevronLeft, ChevronRight, LogOut, Building2,
} from 'lucide-react';
import api from '../services/api';

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();
  const qc = useQueryClient();
  const driver = JSON.parse(localStorage.getItem('driver') || '{}');
  const dateKey = format(selectedDate, 'yyyy-MM-dd');

  const { data: agenda, isLoading } = useQuery({
    queryKey: ['agenda', dateKey],
    queryFn: async () => {
      const { data } = await api.get('/driver/agenda', { params: { date: dateKey } });
      return data.data;
    },
  });

  const completeMutation = useMutation({
    mutationFn: async ({ id, completed }) =>
      api.patch(`/driver/services/${id}/complete`, { completed }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agenda', dateKey] }),
  });

  const openGPS = (service) => {
    const url = service.gps_url || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(service.dropoff_location)}`;
    window.open(url, '_blank');
  };

  const changeDate = (days) => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + days);
      return d;
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('driver');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm">
            <p className="text-slate-400 text-xs">Chauffeur</p>
            <p className="font-semibold">{driver.firstName} {driver.lastName} · {driver.codeId}</p>
          </div>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={() => changeDate(-1)} className="p-2 active:bg-slate-800 rounded-lg">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <p className="text-sm text-slate-400 capitalize">{format(selectedDate, 'EEEE', { locale: fr })}</p>
            <p className="text-lg font-bold">{format(selectedDate, 'dd MMMM yyyy', { locale: fr })}</p>
          </div>
          <button onClick={() => changeDate(1)} className="p-2 active:bg-slate-800 rounded-lg">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4 pb-8">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Chargement...</div>
        ) : !agenda || agenda.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Aucune course prévue ce jour</div>
        ) : (
          agenda.map((s) => (
            <div key={s.id} className={`bg-white rounded-xl shadow border p-4 ${s.completed_by_driver ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-medium">{s.service_code}</p>
                  <h3 className="font-bold text-lg leading-tight">{s.title}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Building2 className="w-3 h-3" />{s.client_name}
                  </p>
                </div>
                <button
                  onClick={() => completeMutation.mutate({ id: s.id, completed: !s.completed_by_driver })}
                  className={`p-2.5 rounded-full shrink-0 ${s.completed_by_driver ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>
                    {format(new Date(s.start_time), 'HH:mm')}
                    {s.end_time && ` - ${format(new Date(s.end_time), 'HH:mm')}`}
                  </span>
                </div>
                {(s.pickup_location || s.dropoff_location || (s.stops && s.stops.length > 0)) && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      {s.pickup_location && <p className="text-slate-700">{s.pickup_location}</p>}
                      {s.stops?.map((stop, i) => (
                        <p key={i} className="text-amber-600 text-xs">↳ {stop}</p>
                      ))}
                      {s.dropoff_location && <p className="text-slate-400 text-xs">→ {s.dropoff_location}</p>}
                    </div>
                  </div>
                )}
              </div>

              {s.notes && (
                <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded-lg mb-3">{s.notes}</p>
              )}

              <button
                onClick={() => openGPS(s)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-semibold active:bg-blue-700"
              >
                <Navigation className="w-5 h-5" />
                Lancer le GPS
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
