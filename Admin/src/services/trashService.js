import api from './api';

export const trashService = {
  // Get paginated trash items by type
  getTrash: async ({ type = 'books', page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams({ type, page, limit });
    const response = await api.get(`/trash?${params.toString()}`);
    return response.data;
  },

  // Get trash summary counts per entity type
  getTrashSummary: async () => {
    const response = await api.get('/trash/summary');
    return response.data;
  },
};
