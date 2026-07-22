import { useState, useRef, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import { Plus, Users } from 'lucide-react';
import { useCalendarEvents, useCreateService, useUpdateService, usePersonnel } from '../../hooks/useApi';
import EventModal from './EventModal';

const VIEWS = [
  { id: 'timeGridDay', label: 'Jour' },
  { id: 'timeGridWeek', label: 'Semaine' },
  { id: 'dayGridMonth', label: 'Mois' },
];

const ymd = (d) => format(new Date(d), 'yyyy-MM-dd');

export default function FullCalendarWrapper() {
  const calendarRef = useRef(null);
  const [view, setView] = useState('timeGridWeek');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [driverFilter, setDriverFilter] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: drivers } = usePersonnel({ role: 'CHAUFFEUR', isActive: true });

  const calendarQuery = useMemo(
    () => ({
      start: dateRange.start,
      end: dateRange.end,
      ...(driverFilter ? { personnelId: driverFilter } : {}),
    }),
    [dateRange, driverFilter]
  );

  const { data: events } = useCalendarEvents(calendarQuery);
  const createService = useCreateService();
  const updateService = useUpdateService();

  // Nombre de services par jour (pour l'en-tête de colonne)
  const countsByDay = useMemo(() => {
    const map = {};
    (events || []).forEach((e) => {
      const k = ymd(e.start);
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [events]);

  const changeView = (id) => {
    setView(id);
    calendarRef.current?.getApi().changeView(id);
  };

  const handleDatesSet = useCallback((dateInfo) => {
    setDateRange({ start: dateInfo.startStr, end: dateInfo.endStr });
  }, []);

  const handleDateSelect = (selectInfo) => {
    setSelectedEvent({ start: selectInfo.start, end: selectInfo.end, isNew: true });
    setIsModalOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    setSelectedEvent({
      id: clickInfo.event.id,
      ...clickInfo.event.extendedProps,
      start: clickInfo.event.start,
      end: clickInfo.event.end,
      isNew: false,
    });
    setIsModalOpen(true);
  };

  const revertOnError = (info, err) => {
    setErrorMsg(err?.response?.data?.message || 'Modification impossible');
    info.revert();
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const handleEventDrop = (dropInfo) => {
    updateService.mutate(
      {
        id: dropInfo.event.id,
        startTime: dropInfo.event.start.toISOString(),
        endTime: dropInfo.event.end?.toISOString() || null,
      },
      { onError: (err) => revertOnError(dropInfo, err) }
    );
  };

  const handleEventResize = (resizeInfo) => {
    updateService.mutate(
      {
        id: resizeInfo.event.id,
        startTime: resizeInfo.event.start.toISOString(),
        endTime: resizeInfo.event.end?.toISOString() || null,
      },
      { onError: (err) => revertOnError(resizeInfo, err) }
    );
  };

  const openNew = () => {
    setSelectedEvent({ start: new Date(), isNew: true });
    setIsModalOpen(true);
  };

  const handleSave = (payload, { onError }) => {
    const mutation = payload.isNew ? createService : updateService;
    const { isNew, ...data } = payload;
    mutation.mutate(data, {
      onSuccess: () => setIsModalOpen(false),
      onError,
    });
  };

  const total = events?.length || 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-slate-100 rounded-lg p-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => changeView(v.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === v.id ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Filtre par chauffeur */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
            <Users className="w-4 h-4 text-slate-400" />
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="text-sm outline-none bg-transparent pr-1"
            >
              <option value="">Tous les chauffeurs</option>
              {drivers?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.codeId} - {d.firstName} {d.lastName}
                </option>
              ))}
            </select>
          </div>

          <span className="text-sm text-slate-500">
            <strong className="text-slate-800">{total}</strong> service{total > 1 ? 's' : ''} affiché{total > 1 ? 's' : ''}
          </span>
        </div>

        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Nouveau service
        </button>
      </div>

      {/* Légende des statuts */}
      <div className="flex items-center gap-4 mb-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500" /> Planifié</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> En cours</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-slate-400" /> Terminé</span>
        <span className="text-slate-400">· couleur de fond = client</span>
      </div>

      {errorMsg && (
        <div className="mb-3 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{errorMsg}</div>
      )}

      <div className="flex-1 bg-white rounded-lg shadow border border-slate-200 overflow-hidden p-2">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
          editable
          selectable
          selectMirror
          dayMaxEvents
          weekends
          nowIndicator
          expandRows
          slotEventOverlap={false}
          locale="fr"
          buttonText={{ today: "Aujourd'hui" }}
          firstDay={1}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          height="100%"
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          events={events || []}
          datesSet={handleDatesSet}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventClassNames={(arg) => [`fc-ev-${arg.event.extendedProps.status || 'PLANIFIE'}`]}
          dayHeaderContent={(arg) => {
            if (arg.view.type === 'dayGridMonth') return arg.text;
            const n = countsByDay[ymd(arg.date)] || 0;
            return {
              html: `<div class="fc-dh-label">${arg.text}</div><div class="fc-dh-count">${n} service${n > 1 ? 's' : ''}</div>`,
            };
          }}
        />
      </div>

      {isModalOpen && (
        <EventModal event={selectedEvent} onClose={() => setIsModalOpen(false)} onSave={handleSave} />
      )}
    </div>
  );
}
