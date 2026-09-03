import api from './api';

export const purchaseService = {
  getAllPurchases: async (status = '') => {
    const params = new URLSearchParams();
    if (status && status !== 'all') {
      params.append('status', status);
    }
    const response = await api.get(`/purchases?${params.toString()}`);
    return response.data;
  },

  getPurchaseById: async (id) => {
    const response = await api.get(`/purchases/${id}`);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/purchases/${id}/status`, { status });
    return response.data;
  },
};
