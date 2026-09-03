import api from './api';

export const memberService = {
  getMembers: async ({ search = '', isActive = '' } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (isActive !== '') params.append('isActive', isActive);

    const response = await api.get(`/members?${params.toString()}`);
    return response.data;
  },

  getMemberById: async (id) => {
    const response = await api.get(`/members/${id}`);
    return response.data;
  },

  updateMember: async (id, memberData) => {
    const response = await api.put(`/members/${id}`, memberData);
    return response.data;
  },

  // Soft delete — moves member to trash
  deleteMember: async (id) => {
    const response = await api.delete(`/members/${id}`);
    return response.data;
  },

  // Restore from trash
  restoreMember: async (id) => {
    const response = await api.put(`/members/${id}/restore`);
    return response.data;
  },

  // Permanent hard delete
  hardDeleteMember: async (id) => {
    const response = await api.delete(`/members/${id}/permanent`);
    return response.data;
  },

  getMemberIssues: async (id) => {
    const response = await api.get(`/members/${id}/issues`);
    return response.data;
  },
};
