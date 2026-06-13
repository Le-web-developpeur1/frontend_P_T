import api from './axios';

export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');
export const updatePassword = (data) => api.put('/auth/password', data);
export const getUsers = () => api.get('/auth/users');
export const createUser = (data) => api.post('/auth/register', data);
export const updateUser = (id, data) => api.put(`/auth/users/${id}`, data);
export const toggleUserStatus = (id) => api.put(`/auth/users/${id}/toggle`);