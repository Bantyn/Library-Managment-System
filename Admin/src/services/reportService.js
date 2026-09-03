import api from './api';

export const reportService = {
  getReportData: async (reportType) => {
    const response = await api.get(`/reports/${reportType}`);
    return response.data;
  },

  downloadCSV: async (reportType) => {
    const response = await api.get(`/reports/${reportType}?format=csv`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
