import { useState, useEffect } from 'react';
import { usePersonnel, useClients, useCancelService } from '../../hooks/useApi';
import { X, MapPin, Clock, User, Building, Trash2, Plus, Flag } from 'lucide-react';

const DEFAULT_DURATION_MIN = 90; // 1h30

const STATUS_OPTIONS = [
  { value: 'PLANIFIE', label: 'Planifié' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINE', label: 'Terminé' },
  { value: 'ANNULE', label: 'Annulé' },
];

function toLocalInput(value) {
  if (!value) return '';
  const d = new Date(value);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export default function EventModal({ event, onClose, onSave }) {
  const { data: personnel } = usePersonnel({ role: 'CHAUFFEUR', isActive: true });
  const { data: clients } = useClients({ isActive: true });
  const cancelService = useCancelService();
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    personnelId: '',
    clientId: '',
    pickupLocation: '',
    dropoffLocation: '',
    stops: [],
    startTime: '',
    endTime: '',
    notes: '',
    status: 'PLANIFIE',
  });

  useEffect(() => {
    if (!event) return;
    const startVal = event.start ? new Date(event.start) : new Date();
    // Fin par défaut : début + 1h30 si aucune fin fournie
    const endVal = event.end ? new Date(event.end) : new Date(startVal.getTime() + DEFAULT_DURATION_MIN * 60000);
    setFormData({
      title: event.title || '',
      personnelId: event.chauffeurId || event.personnelId || '',
      clientId: event.clientId || '',
      pickupLocation: event.pickupLocation || '',
      dropoffLocation: event.dropoffLocation || '',
      stops: Array.isArray(event.stops) ? event.stops : [],
      startTime: toLocalInput(startVal),
      endTime: toLocalInput(endVal),
      notes: event.notes || '',
      status: event.status || 'PLANIFIE',
    });
  }, [event]);

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const setStop = (i, value) => {
    const stops = [...formData.stops];
    stops[i] = value;
    setFormData({ ...formData, stops });
  };
  const addStop = () => setFormData({ ...formData, stops: [...formData.stops, ''] });
  const removeStop = (i) => setFormData({ ...formData, stops: formData.stops.filter((_, k) => k !== i) });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const stops = formData.stops.map((s) => s.trim()).filter(Boolean);
    const hasInfo =
      formData.title.trim() ||
      formData.pickupLocation.trim() ||
      formData.dropoffLocation.trim() ||
      formData.notes.trim() ||
      stops.length > 0;

    if (!formData.personnelId) return setError('Sélectionnez un chauffeur.');
    if (!formData.startTime) return setError("Indiquez l'heure de début.");
    if (!hasInfo) return setError('Renseignez au moins un titre, une adresse ou une note.');

    const payload = {
      id: event?.id,
      isNew: event?.isNew,
      title: formData.title.trim() || null,
      personnelId: formData.personnelId,
      clientId: formData.clientId || null,
      pickupLocation: formData.pickupLocation.trim() || null,
      dropoffLocation: formData.dropoffLocation.trim() || null,
      stops,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
      notes: formData.notes.trim() || null,
    };
    if (!event?.isNew) payload.status = formData.status;

    onSave(payload, {
      onError: (err) => setError(err.response?.data?.message || 'Enregistrement impossible'),
    });
  };

  const handleCancelService = () => {
    if (!event?.id) return;
    if (!window.confirm('Annuler ce service ? (statut → ANNULÉ)')) return;
    cancelService.mutate(event.id, {
      onSuccess: onClose,
      onError: (err) => setError(err.response?.data?.message || 'Annulation impossible'),
    });
  };

  const inputCls =
    'w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">{event?.isNew ? 'Nouveau service' : 'Modifier le service'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Chauffeur (requis) + Statut (édition) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Chauffeur <span className="text-red-500">*</span>
              </label>
              <select value={formData.personnelId} onChange={set('personnelId')} className={inputCls} required>
                <option value="">Sélectionner...</option>
                {personnel?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codeId} - {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
            </div>

            {event?.isNew ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Building className="w-4 h-4 inline mr-1" />
                  Client (optionnel)
                </label>
                <select value={formData.clientId} onChange={set('clientId')} className={inputCls}>
                  <option value="">Particulier</option>
                  {clients?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Flag className="w-4 h-4 inline mr-1" />
                  Statut
                </label>
                <select value={formData.status} onChange={set('status')} className={inputCls}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Début (requis) + Fin */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Début <span className="text-red-500">*</span>
              </label>
              <input type="datetime-local" value={formData.startTime} onChange={set('startTime')} className={inputCls} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Fin (estimée)
              </label>
              <input type="datetime-local" value={formData.endTime} onChange={set('endTime')} className={inputCls} />
              <p className="text-xs text-slate-400 mt-1">Par défaut : début + 1h30</p>
            </div>

            {/* Client (édition) déplacé sous le statut → afficher ici en édition */}
            {!event?.isNew && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Building className="w-4 h-4 inline mr-1" />
                  Client (optionnel)
                </label>
                <select value={formData.clientId} onChange={set('clientId')} className={inputCls}>
                  <option value="">Particulier</option>
                  {clients?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Titre (optionnel mais compte comme "information") */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Titre / Description</label>
              <input type="text" value={formData.title} onChange={set('title')} className={inputCls} placeholder="Ex: Transfert aéroport CDG" />
            </div>

            {/* Adresses : départ, arrêts intermédiaires, destination — tous optionnels */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1 text-green-600" />
                Départ (optionnel)
              </label>
              <input type="text" value={formData.pickupLocation} onChange={set('pickupLocation')} className={inputCls} placeholder="Adresse de prise en charge" />
            </div>

            {formData.stops.length > 0 && (
              <div className="col-span-2 space-y-2">
                <label className="block text-sm font-medium text-slate-700">Arrêts intermédiaires</label>
                {formData.stops.map((stop, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                    <input
                      type="text"
                      value={stop}
                      onChange={(e) => setStop(i, e.target.value)}
                      className={inputCls}
                      placeholder={`Arrêt ${i + 1} (ex: contrôle immigration)`}
                    />
                    <button type="button" onClick={() => removeStop(i)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="col-span-2">
              <button
                type="button"
                onClick={addStop}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <Plus className="w-4 h-4" />
                Ajouter un arrêt
              </button>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1 text-red-600" />
                Destination (optionnel)
              </label>
              <input type="text" value={formData.dropoffLocation} onChange={set('dropoffLocation')} className={inputCls} placeholder="Adresse de destination" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Consignes</label>
              <textarea value={formData.notes} onChange={set('notes')} rows={3} className={inputCls} placeholder="Consignes particulières, informations passager..." />
            </div>
          </div>

          <p className="text-xs text-slate-400">
            <span className="text-red-500">*</span> Requis : chauffeur, heure de début, et au moins une information
            (titre, adresse ou note).
          </p>

          <div className="flex justify-between items-center gap-3 pt-4 border-t">
            <div>
              {!event?.isNew && event?.status !== 'ANNULE' && (
                <button type="button" onClick={handleCancelService} className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                  Annuler le service
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                Fermer
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {event?.isNew ? 'Créer' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
