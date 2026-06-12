import api from './axios';

export const getSystemConfig = () => api.get('/system');
export const updateSystemConfig = (data) => api.put('/system', data);
export const uploadLogo = (formData) => api.post('/system/logo', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);
export const resetSettings = () => api.delete('/settings/reset');