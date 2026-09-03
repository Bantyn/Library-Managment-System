import api from './api';

export const purchaseService = {
  createPurchaseOrder: async (bookId) => {
    const response = await api.post('/purchases/create-order', { bookId });
    return response.data;
  },

  verifyPurchase: async (paymentData) => {
    const response = await api.post('/purchases/verify', paymentData);
    return response.data;
  },

  getMyPurchases: async () => {
    const response = await api.get('/purchases/my-purchases');
    return response.data;
  },
};
