import api from './api';

export const issueService = {
  getIssues: async ({ status = '', student = '', book = '', page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (student) params.append('student', student);
    if (book) params.append('book', book);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);

    const response = await api.get(`/issues?${params.toString()}`);
    return response.data;
  },

  getActiveIssues: async () => {
    const response = await api.get('/issues/active');
    return response.data;
  },

  getOverdueIssues: async () => {
    const response = await api.get('/issues/overdue');
    return response.data;
  },

  getIssueById: async (id) => {
    const response = await api.get(`/issues/${id}`);
    return response.data;
  },

  issueBook: async ({ bookId, studentId, dueDate }) => {
    const response = await api.post('/issues', { bookId, studentId, dueDate });
    return response.data;
  },

  returnBook: async (issueId) => {
    const response = await api.put(`/issues/${issueId}/return`);
    return response.data;
  },
};
