import api from './api';

export const categoryService = {
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
};
