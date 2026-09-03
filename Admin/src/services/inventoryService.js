import api from './api';

export const inventoryService = {
  getInventory: async (params = {}) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  getInventoryStats: async () => {
    const response = await api.get('/inventory/stats');
    return response.data;
  },

  getBookInventory: async (bookId) => {
    const response = await api.get(`/inventory/${bookId}`);
    return response.data;
  },

  getBookTransactions: async (bookId, params = {}) => {
    const response = await api.get(`/inventory/${bookId}/transactions`, { params });
    return response.data;
  },

  stockIn: async (bookId, data) => {
    const response = await api.post(`/inventory/${bookId}/stock-in`, data);
    return response.data;
  },

  markDamage: async (bookId, data) => {
    const response = await api.post(`/inventory/${bookId}/damage`, data);
    return response.data;
  },

  markLost: async (bookId, data) => {
    const response = await api.post(`/inventory/${bookId}/lost`, data);
    return response.data;
  },

  recoverLost: async (bookId, data) => {
    const response = await api.post(`/inventory/${bookId}/recover`, data);
    return response.data;
  },

  adjustStock: async (bookId, data) => {
    const response = await api.post(`/inventory/${bookId}/adjust`, data);
    return response.data;
  },

  physicalStockCheck: async (bookId, data) => {
    const response = await api.post(`/inventory/${bookId}/physical-check`, data);
    return response.data;
  },

  getAllTransactions: async (params = {}) => {
    const response = await api.get('/inventory/transactions', { params });
    return response.data;
  },
};
