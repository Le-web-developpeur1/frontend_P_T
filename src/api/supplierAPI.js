import api from './axios';

export const getSuppliers = () => api.get('/suppliers');
export const getSupplier = (id) => api.get(`/suppliers/${id}`);
export const createSupplier = (data) => api.post('/suppliers', data);
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data);
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`);
export const recordSupplierPayment = (id, data) => api.post(`/suppliers/${id}/payment`, data);
export const recordPurchase = (id, data) => api.post(`/suppliers/${id}/purchase`, data);
export const getSupplierHistory = (id) => api.get(`/suppliers/${id}/history`);