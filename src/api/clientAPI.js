import api from './axios';

export const getClients             = () => api.get('/clients');
export const getClient              = (id) => api.get(`/clients/${id}`);
export const createClient           = (data) => api.post('/clients', data);
export const updateClient           = (id, data) => api.put(`/clients/${id}`, data);
export const deleteClient           = (id) => api.delete(`/clients/${id}`);
export const recordClientPayment    = (id, data) => api.post(`/clients/${id}/payment`, data);
export const downloadPaymentReceipt = (paymentId) => api.get(`/clients/payments/${paymentId}/receipt`, { responseType: 'blob'});
export const getClientCredits       = (id) => api.get(`/clients/${id}/credits`);
export const downloadCreditPDF      = (id) => api.get(`/clients/${id}/credits/pdf`, { responseType: 'blob' });