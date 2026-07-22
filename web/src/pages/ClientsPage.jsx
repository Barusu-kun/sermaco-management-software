import { useState } from 'react';
import { Plus, Pencil, Archive, Mail, Phone, X } from 'lucide-react';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../hooks/useApi';

const EMPTY = { name: '', billingAddress: '', contactEmail: '', contactPhone: '', colorCode: '#3B82F6' };
const PALETTE = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'];

function ClientForm({ initial, onClose }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name || '',
          billingAddress: initial.billingAddress || '',
          contactEmail: initial.contactEmail || '',
          contactPhone: initial.contactPhone || '',
          colorCode: initial.colorCode || '#3B82F6',
        }
      : EMPTY
  );
  const [error, setError] = useState('');
  const create = useCreateClient();
  const update = useUpdateClient();

  const submit = (e) => {
    e.preventDefault();
    setError('');
    const mutation = isEdit ? update : create;
    const args = isEdit ? { id: initial.id, ...form } : form;
    mutation.mutate(args, {
      onSuccess: onClose,
      onError: (err) => setError(err.response?.data?.message || 'Erreur'),
    });
  };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">{isEdit ? 'Modifier' : 'Nouveau'} client</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <div className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom / Société</label>
            <input value={form.name} onChange={set('name')} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Adresse de facturation</label>
            <input value={form.billingAddress} onChange={set('billingAddress')} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={form.contactEmail} onChange={set('contactEmail')} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
              <input value={form.contactPhone} onChange={set('contactPhone')} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Couleur (calendrier)</label>
            <div className="flex gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, colorCode: c })}
                  className={`w-8 h-8 rounded-full border-2 ${form.colorCode === c ? 'border-slate-900 scale-110' : 'border-transparent'} transition-transform`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{isEdit ? 'Enregistrer' : 'Créer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [editing, setEditing] = useState(null);
  const { data: clients, isLoading } = useClients();
  const remove = useDeleteClient();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Clients</h1>
        <button onClick={() => setEditing(EMPTY)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-400">Chargement...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients?.map((c) => (
            <div key={c.id} className={`bg-white rounded-xl shadow border p-5 ${c.isActive ? '' : 'opacity-50'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: c.colorCode }} />
                  <h3 className="font-bold">{c.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(c)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg"><Pencil className="w-4 h-4" /></button>
                  {c.isActive && (
                    <button onClick={() => window.confirm(`Archiver ${c.name} ?`) && remove.mutate(c.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg"><Archive className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                {c.billingAddress && <p>{c.billingAddress}</p>}
                {c.contactEmail && <p className="flex items-center gap-2"><Mail className="w-3 h-3" />{c.contactEmail}</p>}
                {c.contactPhone && <p className="flex items-center gap-2"><Phone className="w-3 h-3" />{c.contactPhone}</p>}
              </div>
            </div>
          ))}
          {clients?.length === 0 && <p className="text-slate-400">Aucun client.</p>}
        </div>
      )}

      {editing && <ClientForm initial={editing.id ? editing : null} onClose={() => setEditing(null)} />}
    </div>
  );
}
