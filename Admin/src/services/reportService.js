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

    // Determine filename from server Content-Disposition header if present
    let filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '').trim();
      }
    }
    if (!filename.toLowerCase().endsWith('.csv')) {
      filename += '.csv';
    }

    // Prepend UTF-8 BOM so Microsoft Excel correctly renders Unicode characters
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), response.data], {
      type: 'text/csv;charset=utf-8;',
    });

    // Check IE / Edge legacy saveBlob
    if (window.navigator && typeof window.navigator.msSaveOrOpenBlob === 'function') {
      window.navigator.msSaveOrOpenBlob(blob, filename);
      return;
    }

    // Standard HTML5 anchor download
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = blobUrl;
    link.setAttribute('download', filename);
    link.setAttribute('target', '_blank');

    document.body.appendChild(link);
    link.click();

    // DELAY revoking object URL by 3 seconds:
    // Calling revokeObjectURL immediately causes Chromium/Edge download manager to lose the blob reference
    // and save the file with an anonymous GUID without extension.
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      window.URL.revokeObjectURL(blobUrl);
    }, 3000);
  },

  getKpis: async () => {
    const response = await api.get('/reports/summary-kpis');
    return response.data;
  },
};
