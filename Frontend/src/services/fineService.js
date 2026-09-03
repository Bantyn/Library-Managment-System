import api from './api';

export const fineService = {
  createFineOrder: async (issueId) => {
    const response = await api.post('/fines/create-order', { issueId });
    return response.data;
  },

  verifyFinePayment: async (paymentData) => {
    const response = await api.post('/fines/verify', paymentData);
    return response.data;
  },

  getMyFines: async () => {
    const response = await api.get('/fines/my-fines');
    return response.data;
  },
};
