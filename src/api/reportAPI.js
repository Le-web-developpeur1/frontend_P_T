import api from './axios';

export const getDailyReport = (params) => api.get('/reports/daily', { params });
export const getMonthlyReport = (params) => api.get('/reports/monthly', { params });
export const getStockReport = () => api.get('/reports/stock');
export const getDebtReport = () => api.get('/reports/debts');
export const getSupplierReport = () => api.get('/reports/suppliers');
export const exportReport = (type, format, params) =>
  api.get(`/reports/${type}/export`, { params: { format, ...params }, responseType: 'blob' });

export const getCaisseReport = () => api.get('/reports/caisse');