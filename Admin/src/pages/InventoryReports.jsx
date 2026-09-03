import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../services/reportService';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';

const InventoryReports = () => {
  const [activeReport, setActiveReport] = useState('inventory-summary');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reportService.getReportData(activeReport);
      if (res.success) {
        setReportData(res.data || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to generate inventory report.'
      );
    } finally {
      setLoading(false);
    }
  }, [activeReport]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleDownloadCSV = async () => {
    setDownloading(true);
    try {
      await reportService.downloadCSV(activeReport);
    } catch (err) {
      alert('Failed to download report CSV.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const reportsConfig = [
    {
      id: 'inventory-summary',
      name: 'Inventory Summary Report',
      description: 'Complete physical holding inventory breakdown including available, issued, damaged, and lost copies per title.',
      icon: 'bi-journal-bookmark',
    },
    {
      id: 'inventory-movement',
      name: 'Inventory Movement Report',
      description: 'Audit log of all stock movements (Stock-in, circulation loans, returns, adjustments, and fulfillments).',
      icon: 'bi-arrow-left-right',
    },
    {
      id: 'low-stock',
      name: 'Low Stock Alert Report',
      description: 'Titles that are below the replenishment threshold or completely out of stock.',
      icon: 'bi-exclamation-triangle',
    },
    {
      id: 'lost-damaged',
      name: 'Lost & Damaged Books Report',
      description: 'Historical register of all library books recorded as damaged or lost with audit explanations.',
      icon: 'bi-tools',
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Inventory Audit & Analytics Reports</h3>
          <p className="text-muted small mb-0">
            Generate and export official library inventory records in CSV and printable PDF formats
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/inventory" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-arrow-left me-1"></i> Back to Inventory
          </Link>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm d-flex align-items-center"
            onClick={handlePrint}
            disabled={loading || reportData.length === 0}
          >
            <i className="bi bi-printer me-1"></i> Print / Save PDF
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm text-dark fw-semibold d-flex align-items-center"
            onClick={handleDownloadCSV}
            disabled={downloading || loading || reportData.length === 0}
          >
            {downloading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                Exporting...
              </>
            ) : (
              <>
                <i className="bi bi-file-earmark-arrow-down me-1"></i> Export CSV
              </>
            )}
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchReport} />}

      {/* Report Selection Tabs */}
      <div className="row g-3 mb-4">
        {reportsConfig.map((r) => (
          <div key={r.id} className="col-12 col-md-6 col-xl-3">
            <div
              className={`card h-100 border cursor-pointer ${
                activeReport === r.id
                  ? 'border-warning shadow bg-warning-subtle'
                  : 'shadow-sm'
              }`}
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveReport(r.id)}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center mb-2">
                  <i className={`bi ${r.icon} fs-4 me-2 ${activeReport === r.id ? 'text-dark' : 'text-secondary'}`}></i>
                  <h6 className="fw-bold text-dark mb-0">{r.name}</h6>
                </div>
                <p className="text-muted small mb-0" style={{ fontSize: '11px', lineHeight: '1.4' }}>
                  {r.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Printable Report Document Card */}
      <div className="card border shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
          <div>
            <h5 className="fw-bold text-dark mb-0">
              {reportsConfig.find((r) => r.id === activeReport)?.name}
            </h5>
            <small className="text-muted">
              Generated on: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • System Audit Record
            </small>
          </div>
          <span className="badge bg-light text-dark border">
            {reportData.length} Records In Report
          </span>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <Loading message="Generating report data..." />
          ) : reportData.length > 0 ? (
            <div className="table-responsive">
              {/* 1. Inventory Summary Table */}
              {activeReport === 'inventory-summary' && (
                <table className="table table-hover align-middle mb-0 bg-white small">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Book Title</th>
                      <th>ISBN</th>
                      <th>Category</th>
                      <th className="text-center">Total</th>
                      <th className="text-center">Available</th>
                      <th className="text-center">Issued</th>
                      <th className="text-center">Damaged</th>
                      <th className="text-center">Lost</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={idx}>
                        <td className="text-muted">{idx + 1}</td>
                        <td className="fw-medium text-dark">{row.book}</td>
                        <td><code>{row.isbn}</code></td>
                        <td>{row.category}</td>
                        <td className="text-center fw-bold">{row.total}</td>
                        <td className="text-center fw-bold text-success">{row.available}</td>
                        <td className="text-center text-primary">{row.issued}</td>
                        <td className="text-center text-warning-emphasis">{row.damaged}</td>
                        <td className="text-center text-danger">{row.lost}</td>
                        <td className="text-center">
                          <span className={`badge ${
                            row.status === 'IN_STOCK'
                              ? 'bg-success-subtle text-success border border-success-subtle'
                              : row.status === 'LOW_STOCK'
                              ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                              : 'bg-danger-subtle text-danger border border-danger-subtle'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* 2. Inventory Movement Table */}
              {activeReport === 'inventory-movement' && (
                <table className="table table-hover align-middle mb-0 bg-white small">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Book Title</th>
                      <th>Type</th>
                      <th className="text-center">Quantity</th>
                      <th className="text-center">Stock (Prev → New)</th>
                      <th>Audit Reason</th>
                      <th>Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={idx}>
                        <td className="text-muted">{idx + 1}</td>
                        <td>{row.date}</td>
                        <td className="fw-medium text-dark">{row.book}</td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {row.transactionType}
                          </span>
                        </td>
                        <td className="text-center fw-bold">
                          {row.quantity}
                        </td>
                        <td className="text-center">
                          <code>{row.previousQuantity}</code> → <strong>{row.newQuantity}</strong>
                        </td>
                        <td>{row.reason}</td>
                        <td className="text-muted">{row.admin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* 3. Low Stock Table */}
              {activeReport === 'low-stock' && (
                <table className="table table-hover align-middle mb-0 bg-white small">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Book Title</th>
                      <th>ISBN</th>
                      <th>Category</th>
                      <th className="text-center">Available Copies</th>
                      <th className="text-center">Total Copies</th>
                      <th className="text-center">Threshold</th>
                      <th className="text-center">Stock Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={idx}>
                        <td className="text-muted">{idx + 1}</td>
                        <td className="fw-medium text-dark">{row.book}</td>
                        <td><code>{row.isbn}</code></td>
                        <td>{row.category}</td>
                        <td className="text-center fw-bold text-danger fs-6">{row.available}</td>
                        <td className="text-center">{row.total}</td>
                        <td className="text-center">{row.threshold}</td>
                        <td className="text-center">
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* 4. Lost & Damaged Table */}
              {activeReport === 'lost-damaged' && (
                <table className="table table-hover align-middle mb-0 bg-white small">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Book Title</th>
                      <th>Type</th>
                      <th className="text-center">Quantity</th>
                      <th>Audit Reason</th>
                      <th>Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={idx}>
                        <td className="text-muted">{idx + 1}</td>
                        <td>{row.date}</td>
                        <td className="fw-medium text-dark">{row.book}</td>
                        <td>
                          <span className={`badge ${
                            row.type === 'DAMAGE'
                              ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                              : 'bg-danger-subtle text-danger border border-danger-subtle'
                          }`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="text-center fw-bold">{row.quantity}</td>
                        <td>{row.reason}</td>
                        <td className="text-muted">{row.admin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-muted">
              <i className="bi bi-file-earmark-text fs-3 d-block mb-2"></i>
              No records found for the selected inventory report.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryReports;
