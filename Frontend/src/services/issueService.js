import api from './api';

export const issueService = {
  getMemberIssues: async (studentId) => {
    const response = await api.get(`/members/${studentId}/issues`);
    return response.data;
  },
};
