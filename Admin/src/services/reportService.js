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

  downloadCSV: (reportType, params = {}) => {
    const token = localStorage.getItem('token') || '';
    const query = new URLSearchParams();
    query.append('format', 'csv');
    if (token) {
      query.append('token', token);
    }
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });

    const baseURL = api.defaults.baseURL || 'http://localhost:5000/api';
    const downloadUrl = `${baseURL}/reports/${reportType}?${query.toString()}`;

    // Direct browser navigation download:
    // Hits the backend endpoint directly where Express responds with
    // Content-Type: text/csv and Content-Disposition: attachment; filename="<name>.csv".
    // This allows the browser to save the file with its exact intended filename and .csv extension.
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = downloadUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 1500);
  },

  getKpis: async () => {
    const response = await api.get('/reports/summary-kpis');
    return response.data;
  },
};
