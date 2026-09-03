import api from './api';

export const reportService = {
  getReportData: async (reportType, params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const response = await api.get(`/reports/${reportType}${queryString}`);
    return response.data;
  },

  downloadCSV: async (reportType, params = {}) => {
    const query = new URLSearchParams();
    query.append('format', 'csv');
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const response = await api.get(`/reports/${reportType}?${query.toString()}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getKpis: async () => {
    const response = await api.get('/reports/summary-kpis');
    return response.data;
  },
};
