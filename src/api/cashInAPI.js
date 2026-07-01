import api from './axios';

export const addCashIn  = (data) => api.post('/cashin', data);
export const getCashIns = ()     => api.get('/cashin');
export const addBankIn  = (data) => api.post('/cashin/bank', data);
export const getBankIns = ()     => api.get('/cashin/bank');