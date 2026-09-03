import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';

const REPORT_TABS = [
  { id: 'books', name: 'Book Catalog', icon: 'bi-book' },
  { id: 'issues', name: 'Circulation / Issues', icon: 'bi-journal-arrow-up' },
  { id: 'overdue', name: 'Overdue Loans', icon: 'bi-clock-history' },
  { id: 'members', name: 'Member Registry', icon: 'bi-people' },
  { id: 'purchases', name: 'Book Purchases', icon: 'bi-bag-check' },
  { id: 'fines', name: 'Fine Settlements', icon: 'bi-cash-coin' },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState('books');
  const [kpis, setKpis] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch KPI Cards
  useEffect(() => {
    const fetchKpis = async () => {
      setLoadingKpis(true);
      try {
        const res = await reportService.getKpis();
        if (res.success) {
          setKpis(res.data);
        }
      } catch (err) {
        console.error('Failed to load report KPIs:', err.message);
      } finally {
        setLoadingKpis(false);
      }
    };
    fetchKpis();
  }, []);

  // Fetch active report data
  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (statusFilter) params.status = statusFilter;

      const res = await reportService.getReportData(activeTab, params);
      if (res.success) {
        setReportData(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report preview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setStatusFilter('');
    setTimeout(() => fetchReport(), 0);
  };

  const handleDownloadCsv = async () => {
    setDownloadingCsv(true);
    try {
      const params = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (statusFilter) params.status = statusFilter;
      await reportService.downloadCSV(activeTab, params);
    } catch (err) {
      alert('Failed to download CSV: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Dynamic headers based on active report
  const getColumns = () => {
    switch (activeTab) {
      case 'books':
        return [
          { label: 'Title', key: 'title' },
          { label: 'Author', key: 'author' },
          { label: 'ISBN', key: 'isbn' },
          { label: 'Category', key: 'category' },
          { label: 'Total', key: 'totalCopies' },
          { label: 'Available', key: 'availableCopies' },
          { label: 'Issued', key: 'issuedCopies' },
          { label: 'Price', key: 'purchasePrice' },
          { label: 'Status', key: 'status' },
        ];
      case 'issues':
        return [
          { label: 'Student', key: 'studentName' },
          { label: 'Student ID', key: 'studentId' },
          { label: 'Library Card ID', key: 'libraryCardId' },
          { label: 'Book Title', key: 'bookTitle' },
          { label: 'Issue Date', key: 'issueDate' },
          { label: 'Due Date', key: 'dueDate' },
          { label: 'Return Date', key: 'returnDate' },
          { label: 'Status', key: 'status' },
          { label: 'Fine', key: 'fine' },
        ];
      case 'overdue':
        return [
          { label: 'Student', key: 'studentName' },
          { label: 'Student ID', key: 'studentId' },
          { label: 'Library Card ID', key: 'libraryCardId' },
          { label: 'Phone', key: 'phone' },
          { label: 'Book Title', key: 'bookTitle' },
          { label: 'Due Date', key: 'dueDate' },
          { label: 'Days Overdue', key: 'daysOverdue' },
          { label: 'Fine Accrued', key: 'fineAccrued' },
          { label: 'Payment', key: 'paymentStatus' },
        ];
      case 'members':
        return [
          { label: 'Library Card ID', key: 'libraryCardId' },
          { label: 'Student ID', key: 'studentId' },
          { label: 'Full Name', key: 'name' },
          { label: 'Email Address', key: 'email' },
          { label: 'Phone', key: 'phone' },
          { label: 'Status', key: 'status' },
          { label: 'Registered On', key: 'registrationDate' },
        ];
      case 'purchases':
        return [
          { label: 'Student', key: 'studentName' },
          { label: 'Library Card ID', key: 'libraryCardId' },
          { label: 'Book Purchased', key: 'bookTitle' },
          { label: 'Amount', key: 'amount' },
          { label: 'Purchase Date', key: 'purchaseDate' },
          { label: 'Order Status', key: 'status' },
          { label: 'Razorpay Payment ID', key: 'razorpayPaymentId' },
        ];
      case 'fines':
        return [
          { label: 'Student', key: 'studentName' },
          { label: 'Library Card ID', key: 'libraryCardId' },
          { label: 'Amount Paid', key: 'amount' },
          { label: 'Method', key: 'paymentMethod' },
          { label: 'Status', key: 'paymentStatus' },
          { label: 'Payment Date', key: 'paymentDate' },
          { label: 'Collected By', key: 'collectedBy' },
          { label: 'Reference / Receipt', key: 'transactionRef' },
        ];
      default:
        return [];
    }
  };

  const columns = getColumns();

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2 no-print">
        <div>
          <h3 className="fw-bold text-dark mb-1">AWD Institutional Reports</h3>
          <p className="text-muted small mb-0">
            Real-time database reporting, catalog audits, financial settlements, and circulation summaries
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center"
            onClick={handlePrint}
          >
            <i className="bi bi-printer me-1"></i> Print / PDF
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm text-dark fw-semibold d-flex align-items-center"
            onClick={handleDownloadCsv}
            disabled={downloadingCsv || reportData.length === 0}
          >
            {downloadingCsv ? (
              <span className="spinner-border spinner-border-sm me-1" role="status"></span>
            ) : (
              <i className="bi bi-download me-1"></i>
            )}
            Export CSV
          </button>
        </div>
      </div>

      {/* SECTION 1: 8 SUMMARY KPI CARDS */}
      <div className="row g-3 mb-4 no-print">
        {[
          { label: 'Total Books', value: kpis?.totalBooks ?? '—', icon: 'bi-journal-bookmark', bg: 'bg-primary-subtle text-primary' },
          { label: 'Total Members', value: kpis?.totalMembers ?? '—', icon: 'bi-people', bg: 'bg-info-subtle text-info' },
          { label: 'Total Loans', value: kpis?.totalIssues ?? '—', icon: 'bi-arrow-left-right', bg: 'bg-warning-subtle text-warning-emphasis' },
          { label: 'Overdue Loans', value: kpis?.totalOverdue ?? '—', icon: 'bi-exclamation-triangle', bg: 'bg-danger-subtle text-danger' },
          { label: 'Book Sales', value: kpis?.totalPurchases ?? '—', icon: 'bi-bag-check', bg: 'bg-success-subtle text-success' },
          { label: 'Book Revenue', value: `₹${kpis?.purchaseRevenue ?? 0}`, icon: 'bi-currency-rupee', bg: 'bg-success-subtle text-success' },
          { label: 'Fine Collected', value: `₹${kpis?.collectedFine ?? 0}`, icon: 'bi-check-circle', bg: 'bg-primary-subtle text-primary' },
          { label: 'Unpaid Fines', value: `₹${kpis?.outstandingFine ?? 0}`, icon: 'bi-clock', bg: 'bg-danger-subtle text-danger' },
        ].map((item, idx) => (
          <div key={idx} className="col-6 col-md-3 col-xl">
            <div className="card h-100 border shadow-sm">
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {item.label}
                  </span>
                  <div className={`rounded p-1 ${item.bg}`} style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`bi ${item.icon}`} style={{ fontSize: '12px' }}></i>
                  </div>
                </div>
                <h5 className="fw-bold text-dark mb-0">{item.value}</h5>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 2: REPORT TABS */}
      <ul className="nav nav-tabs mb-4 no-print">
        {REPORT_TABS.map((tab) => (
          <li className="nav-item" key={tab.id}>
            <button
              className={`nav-link fw-medium d-flex align-items-center ${
                activeTab === tab.id ? 'active text-primary fw-bold' : 'text-secondary'
              }`}
              onClick={() => {
                setActiveTab(tab.id);
                setFromDate('');
                setToDate('');
                setStatusFilter('');
              }}
            >
              <i className={`bi ${tab.icon} me-2`}></i>
              {tab.name}
            </button>
          </li>
        ))}
      </ul>

      {/* SECTION 3: FILTER TOOLBAR */}
      <div className="card border shadow-sm mb-4 no-print">
        <div className="card-body p-3">
          <form onSubmit={handleApplyFilters} className="row g-2 align-items-center">
            <div className="col-12 col-md-3">
              <label className="form-label small text-muted mb-1">From Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label small text-muted mb-1">To Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            {['issues', 'purchases'].includes(activeTab) && (
              <div className="col-12 col-md-3">
                <label className="form-label small text-muted mb-1">Status Filter</label>
                <select
                  className="form-select form-select-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {activeTab === 'issues' && (
                    <>
                      <option value="issued">Active Loans</option>
                      <option value="returned">Returned</option>
                      <option value="overdue">Overdue</option>
                    </>
                  )}
                  {activeTab === 'purchases' && (
                    <>
                      <option value="paid">Paid</option>
                      <option value="processing">Processing</option>
                      <option value="fulfilled">Fulfilled</option>
                    </>
                  )}
                </select>
              </div>
            )}

            <div className="col-12 col-md-3 d-flex gap-2 align-self-end mt-2 mt-md-0">
              <button type="submit" className="btn btn-outline-primary btn-sm flex-grow-1">
                <i className="bi bi-funnel me-1"></i> Apply
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={handleResetFilters}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* SECTION 4: DATA PREVIEW TABLE */}
      <div className="card border shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
            <i className="bi bi-table me-2 text-primary"></i>
            {REPORT_TABS.find((t) => t.id === activeTab)?.name} Preview ({reportData.length} Records)
          </h6>
          <span className="badge bg-light text-muted border small">
            Live Database Sync
          </span>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <Loading message="Generating database report preview..." />
          ) : reportData.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 bg-white small">
                <thead className="table-light">
                  <tr>
                    {columns.map((col, idx) => (
                      <th key={idx} scope="col">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {columns.map((col, cIdx) => (
                        <td key={cIdx}>
                          {col.key === 'libraryCardId' ? (
                            <span className="badge bg-light text-dark border font-monospace px-2 py-1">
                              {row[col.key]}
                            </span>
                          ) : col.key === 'studentId' ? (
                            <code className="text-dark bg-light px-2 py-1 rounded">
                              {row[col.key]}
                            </code>
                          ) : col.key === 'status' || col.key === 'paymentStatus' ? (
                            <span
                              className={`badge ${
                                ['In Stock', 'RETURNED', 'PAID', 'Active', 'Settled', 'FULFILLED'].includes(
                                  row[col.key]
                                )
                                  ? 'bg-success-subtle text-success border border-success-subtle'
                                  : ['OVERDUE', 'Out of Stock', 'Unpaid Penalty', 'Deactivated'].includes(
                                      row[col.key]
                                    )
                                  ? 'bg-danger-subtle text-danger border border-danger-subtle'
                                  : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                              }`}
                            >
                              {row[col.key]}
                            </span>
                          ) : (
                            <span>{row[col.key]}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
              <h6>No Records Found</h6>
              <p className="small mb-0">No records match the selected date range and filter criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
