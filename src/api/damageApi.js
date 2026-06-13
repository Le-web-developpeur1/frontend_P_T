import api from './axios';

export const getDamages      = () => api.get('/damages');
export const getDamageStats  = () => api.get('/damages/stats');
export const createDamage    = (data) => api.post('/damages', data);
export const deleteDamage    = (id) => api.delete(`/damages/${id}`);