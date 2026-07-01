import api from './axios';

export const getDailyReport   = (params) => api.get('/reports/daily',   { params });
export const getMonthlyReport = (params) => api.get('/reports/monthly', { params });
export const getStockReport   = ()       => api.get('/reports/stock');
export const getDebtReport    = ()       => api.get('/reports/debts');
export const getSupplierReport = ()      => api.get('/reports/suppliers');
export const getCapitalReport  = ()      => api.get('/reports/capital');
export const getCaisseReport   = ()      => api.get('/reports/caisse');

export const exportReport = (type, format, params) =>
  api.get(`/reports/${type}/export`, { params: { format, ...params }, responseType: 'blob' });

// ── Nouveaux : mouvements détaillés caisse et banque ──
export const getCaisseMovements = (params) => api.get('/reports/caisse-movements', { params });
export const getBankMovements   = (params) => api.get('/reports/bank-movements',   { params });

// ── Exports caisse et banque ──
export const exportCaisseReport = (format, params) =>
  api.get('/reports/export/caisse', { params: { format, ...params }, responseType: 'blob' });
export const exportBankReport = (format, params) =>
  api.get('/reports/export/banque', { params: { format, ...params }, responseType: 'blob' });