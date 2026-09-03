import api from './api';

export const fineService = {
  getAllFines: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.paymentMethod && params.paymentMethod !== 'all')
      query.append('paymentMethod', params.paymentMethod);

    const response = await api.get(`/fines?${query.toString()}`);
    return response.data;
  },

  collectCashFine: async (issueId) => {
    const response = await api.post(`/fines/${issueId}/collect`, {
      paymentMethod: 'cash',
    });
    return response.data;
  },

  getIssueFineDetails: async (issueId) => {
    const response = await api.get(`/fines/${issueId}`);
    return response.data;
  },
};
