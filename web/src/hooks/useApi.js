import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/* ─────────────── Personnel ─────────────── */
export const usePersonnel = (filters = {}) =>
  useQuery({
    queryKey: ['personnel', filters],
    queryFn: async () => {
      const { data } = await api.get('/personnel', { params: filters });
      return data.data;
    },
  });

export const useCreatePersonnel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/personnel', payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personnel'] }),
  });
};

export const useUpdatePersonnel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await api.put(`/personnel/${id}`, payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personnel'] }),
  });
};

export const useDeletePersonnel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/personnel/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personnel'] }),
  });
};

/* ─────────────── Clients ─────────────── */
export const useClients = (filters = {}) =>
  useQuery({
    queryKey: ['clients', filters],
    queryFn: async () => {
      const { data } = await api.get('/clients', { params: filters });
      return data.data;
    },
  });

export const useCreateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/clients', payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
};

export const useUpdateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await api.put(`/clients/${id}`, payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
};

export const useDeleteClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/clients/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
};

/* ─────────────── Services / Planning ─────────────── */
export const useServices = (filters = {}) =>
  useQuery({
    queryKey: ['services', filters],
    queryFn: async () => {
      const { data } = await api.get('/services', { params: filters });
      return data.data;
    },
  });

export const useCalendarEvents = (range) =>
  useQuery({
    queryKey: ['calendar', range],
    queryFn: async () => (await api.get('/calendar/services', { params: range })).data,
    enabled: !!range.start && !!range.end,
  });

export const useCreateService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/services', payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
};

export const useUpdateService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await api.put(`/services/${id}`, payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
};

export const useCancelService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/services/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
};

/* ─────────────── Statistiques ─────────────── */
export const useStats = (period) =>
  useQuery({
    queryKey: ['stats', period],
    queryFn: async () => (await api.get('/stats/dashboard', { params: period })).data,
    enabled: !!period.startDate && !!period.endDate,
  });

export const useDriverStats = (period) =>
  useQuery({
    queryKey: ['stats-by-driver', period],
    queryFn: async () => (await api.get('/stats/by-driver', { params: period })).data,
    enabled: !!period.startDate && !!period.endDate,
  });

/* ─────────────── Facturation (escales Portic) ─────────────── */
export const useVesselSearch = (q) =>
  useQuery({
    queryKey: ['vessels', q],
    queryFn: async () => (await api.get('/facturation/vessels', { params: { q } })).data.results,
    enabled: (q?.trim().length || 0) >= 2,
    staleTime: 5 * 60 * 1000,
  });

export const usePortCalls = (query) =>
  useQuery({
    queryKey: ['portcalls', query],
    queryFn: async () =>
      (await api.get('/facturation/portcalls', { params: query })).data,
    enabled: !!query?.vessel,
    retry: false,
    staleTime: 30 * 1000,
  });

export const useAttachService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/facturation/attach', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portcalls'] }),
  });
};

/* ─────────────── Roster / Jours de travail ─────────────── */
export const useRoster = (month) =>
  useQuery({
    queryKey: ['roster', month],
    queryFn: async () => (await api.get('/roster', { params: { month } })).data,
    enabled: !!month,
  });

export const useGenerateRoster = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/roster/generate', payload)).data,
    onSuccess: (data) => qc.setQueryData(['roster', data.month], data),
  });
};

export const useUpdateRosterEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.put('/roster/entry', payload)).data,
    onSuccess: (data) => qc.setQueryData(['roster', data.month], data),
  });
};

export const useRosterProfiles = () =>
  useQuery({
    queryKey: ['roster-profiles'],
    queryFn: async () => (await api.get('/roster/profiles')).data,
  });

export const useSaveRosterProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.put('/roster/profiles', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roster-profiles'] }),
  });
};
