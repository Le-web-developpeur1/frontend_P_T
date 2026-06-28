import api from './axios';

export const getBankReport    = () => api.get('/bank');
export const transferToBanque = (data) => api.post('/bank/transfer', data);