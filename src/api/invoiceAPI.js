import api from './axios';

export const getInvoices = () => api.get('/invoices');
export const getInvoice = (id) => api.get(`/invoices/${id}`);
export const createInvoice = (data) => api.post('/invoices', data);
export const deleteInvoice = (id) => api.delete(`/invoices/${id}`);
export const saveClientSignature = (id, data) => api.put(`/invoices/${id}/signature`, data);
export const downloadInvoicePDF = (id) => api.get(`/invoices/${id}/pdf`, { 
  responseType: 'blob',
  headers: { 'Cache-Control': 'no-cache' }
});