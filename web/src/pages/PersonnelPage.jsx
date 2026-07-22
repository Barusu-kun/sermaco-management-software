import { useState } from 'react';
import { Plus, Pencil, Archive, Phone, Search, X } from 'lucide-react';
import {
  usePersonnel,
  useCreatePersonnel,
  useUpdatePersonnel,
  useDeletePersonnel,
} from '../hooks/useApi';

const EMPTY = { firstName: '', lastName: '', role: 'CHAUFFEUR', phone: '', pinCode: '', isActive: true };

function PersonnelForm({ initial, onClose }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(initial || EMPTY);
  const [error, setError] = useState('');
  const create = useCreatePersonnel();
  const update = useUpdatePersonnel();

  const submit = (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone || null,
    };
    if (form.pinCode) payload.pinCode = form.pinCode;
    if (!isEdit) payload.role = form.role;

    const mutation = isEdit ? update : create;
    const args = isEdit ? { id: initial.id, ...payload } : payload;
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
          <h2 className="text-xl font-bold">{isEdit ? 'Modifier' : 'Nouveau'} membre</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
              <input value={form.firstName} onChange={set('firstName')} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
              <input value={form.lastName} onChange={set('lastName')} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
              <select value={form.role} onChange={set('role')} disabled={isEdit} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100">
                <option value="CHAUFFEUR">Chauffeur</option>
                <option value="DISPATCH">Dispatch</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
              <input value={form.phone || ''} onChange={set('phone')} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Code PIN (4 chiffres)</label>
              <input value={form.pinCode || ''} onChange={set('pinCode')} maxLength={4} inputMode="numeric" placeholder={isEdit ? 'Inchangé' : '0000'} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
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

export default function PersonnelPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const { data: personnel, isLoading } = usePersonnel({
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(search ? { search } : {}),
  });
  const remove = useDeletePersonnel();

  const roleBadge = (role) =>
    role === 'DISPATCH' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Personnel</h1>
        <button onClick={() => setEditing(EMPTY)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, prénom, code..."
            className="border-none outline-none text-sm flex-1 bg-transparent"
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="bg-white border rounded-lg px-3 py-2 text-sm outline-none">
          <option value="">Tous les rôles</option>
          <option value="CHAUFFEUR">Chauffeurs</option>
          <option value="DISPATCH">Dispatch</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Rôle</th>
              <th className="px-4 py-3 font-medium">Téléphone</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Chargement...</td></tr>
            ) : personnel?.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Aucun résultat</td></tr>
            ) : (
              personnel?.map((p) => (
                <tr key={p.id} className={p.isActive ? '' : 'opacity-50'}>
                  <td className="px-4 py-3 font-mono text-slate-600">{p.codeId}</td>
                  <td className="px-4 py-3 font-medium">{p.firstName} {p.lastName}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${roleBadge(p.role)}`}>{p.role}</span></td>
                  <td className="px-4 py-3 text-slate-600">{p.phone ? (<span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>) : '—'}</td>
                  <td className="px-4 py-3">{p.isActive ? <span className="text-green-600">Actif</span> : <span className="text-slate-400">Archivé</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing(p)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg" title="Modifier"><Pencil className="w-4 h-4" /></button>
                      {p.isActive && (
                        <button
                          onClick={() => window.confirm(`Archiver ${p.firstName} ${p.lastName} ?`) && remove.mutate(p.id)}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg"
                          title="Archiver"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && <PersonnelForm initial={editing.id ? editing : null} onClose={() => setEditing(null)} />}
    </div>
  );
}
