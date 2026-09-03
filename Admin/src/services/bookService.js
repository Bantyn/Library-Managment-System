import api from './api';

export const bookService = {
  getBooks: async ({ search = '', category = '', page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);

    const response = await api.get(`/books?${params.toString()}`);
    return response.data;
  },

  getBookById: async (id) => {
    const response = await api.get(`/books/${id}`);
    return response.data;
  },

  createBook: async (bookData) => {
    const isFormData = bookData instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await api.post('/books', bookData, config);
    return response.data;
  },

  updateBook: async (id, bookData) => {
    const isFormData = bookData instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await api.put(`/books/${id}`, bookData, config);
    return response.data;
  },

  // Soft delete — moves book to trash
  deleteBook: async (id) => {
    const response = await api.delete(`/books/${id}`);
    return response.data;
  },

  // Restore from trash
  restoreBook: async (id) => {
    const response = await api.put(`/books/${id}/restore`);
    return response.data;
  },

  // Permanent hard delete (requires backend dependency validation)
  hardDeleteBook: async (id) => {
    const response = await api.delete(`/books/${id}/permanent`);
    return response.data;
  },
};
