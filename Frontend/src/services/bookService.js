import api from './api';

export const bookService = {
  getBooks: async ({ search = '', category = '', page = 1, limit = 12 } = {}) => {
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

  getPublicStats: async () => {
    const response = await api.get('/books/public-stats');
    return response.data;
  },
};
