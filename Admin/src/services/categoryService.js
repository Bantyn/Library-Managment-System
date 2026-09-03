import api from './api';

export const categoryService = {
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  getCategoryById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  // Soft delete — moves category to trash
  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },

  // Restore from trash
  restoreCategory: async (id) => {
    const response = await api.put(`/categories/${id}/restore`);
    return response.data;
  },

  // Permanent hard delete
  hardDeleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}/permanent`);
    return response.data;
  },
};
