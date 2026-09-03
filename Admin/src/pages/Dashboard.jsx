import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { memberService } from '../services/memberService';
import { formatDate, formatDateTime } from '../utils/formatDate';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quick Library Card Lookup state
  const [quickLookupId, setQuickLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardService.getDashboardStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load dashboard metrics. Ensure the backend is active.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLookup = async (e) => {
    e.preventDefault();
    const cleanId = quickLookupId.trim();
    if (!cleanId) return;

    setLookupLoading(true);
    setLookupError('');
    setLookupResult(null);
    try {
      const res = await memberService.getMembers({ libraryCardId: cleanId });
      if (res.success && res.data?.length > 0) {
        setLookupResult(res.data[0]);
      } else {
        setLookupError(`No member record found matching Library Card ID "${cleanId}".`);
      }
    } catch (err) {
      setLookupError('Error looking up student record.');
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <Loading message="Loading dashboard metrics..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchDashboardData} />;
  }

  const inventoryCards = [
    {
      title: 'Total Titles',
      value: stats?.totalTitles || 0,
      icon: 'bi-book',
      bgClass: 'bg-primary-subtle text-primary border-primary-subtle',
      subtext: `${stats?.totalPhysicalCopies || stats?.totalBooks || 0} physical copies`,
      link: '/books',
    },
    {
      title: 'Available Copies',
      value: stats?.totalAvailableCopies !== undefined ? stats.totalAvailableCopies : stats?.availableBooks || 0,
      icon: 'bi-check-circle',
      bgClass: 'bg-success-subtle text-success border-success-subtle',
      subtext: 'In circulation stock',
      link: '/inventory?status=in_stock',
    },
    {
      title: 'Issued (On Loan)',
      value: stats?.totalIssuedCopies || stats?.issuedBooks || 0,
      icon: 'bi-journal-arrow-up',
      bgClass: 'bg-info-subtle text-info border-info-subtle',
      subtext: 'Active circulation loans',
      link: '/issues',
    },
    {
      title: 'Damaged Copies',
      value: stats?.totalDamagedCopies || 0,
      icon: 'bi-tools',
      bgClass: 'bg-warning-subtle text-warning-emphasis border-warning-subtle',
      subtext: 'Under repair / discarded',
      link: '/inventory?status=damaged',
    },
    {
      title: 'Lost Copies',
      value: stats?.totalLostCopies || 0,
      icon: 'bi-question-diamond',
      bgClass: 'bg-danger-subtle text-danger border-danger-subtle',
      subtext: 'Reported lost copies',
      link: '/inventory?status=lost',
    },
    {
      title: 'Registered Students',
      value: stats?.totalStudents || 0,
      icon: 'bi-people',
      bgClass: 'bg-secondary-subtle text-secondary border-secondary-subtle',
      subtext: 'Active student accounts',
      link: '/members',
    },
  ];

  const financialCards = [
    {
      title: 'Total Purchases',
      value: stats?.totalPurchases || 0,
      icon: 'bi-bag-check',
      bgClass: 'bg-success-subtle text-success border-success-subtle',
      subtext: 'Completed book sales',
      link: '/purchases',
    },
    {
      title: 'Purchase Revenue',
      value: `₹${(stats?.purchaseRevenue || 0).toLocaleString()}`,
      icon: 'bi-currency-rupee',
      bgClass: 'bg-primary-subtle text-primary border-primary-subtle',
      subtext: 'Processed via Razorpay',
      link: '/purchases',
    },
    {
      title: 'Outstanding Fines',
      value: `₹${(stats?.outstandingFines || 0).toLocaleString()}`,
      icon: 'bi-hourglass-split',
      bgClass: 'bg-danger-subtle text-danger border-danger-subtle',
      subtext: 'Pending student payment',
      link: '/issues',
    },
    {
      title: 'Fines Collected',
      value: `₹${(stats?.fineCollected || 0).toLocaleString()}`,
      icon: 'bi-cash-coin',
      bgClass: 'bg-info-subtle text-info border-info-subtle',
      subtext: 'Online & cash collected',
      link: '/fine-payments',
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1">Library Overview</h3>
          <p className="text-muted small mb-0">
            Real-time physical inventory, circulation metrics, student sales, and fine collections
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/inventory" className="btn btn-outline-secondary btn-sm d-flex align-items-center">
            <i className="bi bi-box-seam me-1"></i> Inventory Center
          </Link>
          <Link to="/issues/issue-book" className="btn btn-primary btn-sm d-flex align-items-center">
            <i className="bi bi-journal-plus me-1"></i> Issue Book
          </Link>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {stats?.lowStockBooks && stats.lowStockBooks.length > 0 && (
        <div className="alert alert-warning border border-warning shadow-sm d-flex justify-content-between align-items-center mb-4" role="alert">
          <div className="d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill fs-4 me-3 text-warning-emphasis"></i>
            <div>
              <strong className="d-block text-warning-emphasis">Low Stock Replenishment Alert!</strong>
              <small className="text-dark">
                {stats.lowStockBooks.length} book(s) have available copies at or below their alert threshold (e.g. {stats.lowStockBooks.map(b => b.book?.title).filter(Boolean).slice(0, 3).join(', ')}).
              </small>
            </div>
          </div>
          <Link to="/inventory?status=low_stock" className="btn btn-warning btn-sm text-dark fw-semibold ms-3 text-nowrap">
            View Low Stock Books
          </Link>
        </div>
      )}

      {/* Quick Library Card / Pass Lookup Widget */}
      <div className="card border shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div className="d-flex align-items-center">
              <div className="bg-primary-subtle text-primary rounded p-2 me-3 border border-primary-subtle">
                <i className="bi bi-upc-scan fs-4"></i>
              </div>
              <div>
                <h6 className="fw-bold text-dark mb-0">Quick Member / Library Card Lookup</h6>
                <small className="text-muted">Instantly verify student identity, borrowing eligibility, and card status</small>
              </div>
            </div>

            <form onSubmit={handleQuickLookup} className="d-flex gap-2 w-100" style={{ maxWidth: '420px' }}>
              <input
                type="text"
                className="form-control form-control-sm font-monospace"
                placeholder="12-digit Card ID (e.g. 000000000001)..."
                maxLength="12"
                value={quickLookupId}
                onChange={(e) => setQuickLookupId(e.target.value.replace(/\D/g, ''))}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm text-dark fw-semibold text-nowrap d-flex align-items-center"
                disabled={lookupLoading || !quickLookupId.trim()}
              >
                {lookupLoading ? <span className="spinner-border spinner-border-sm me-1" role="status"></span> : <i className="bi bi-search me-1"></i>}
                Lookup
              </button>
            </form>
          </div>

          {lookupError && (
            <div className="alert alert-danger mt-3 mb-0 py-2 px-3 small d-flex align-items-center">
              <i className="bi bi-exclamation-circle-fill me-2"></i>
              {lookupError}
            </div>
          )}

          {lookupResult && (
            <div className="alert alert-success mt-3 mb-0 py-2 px-3 small d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <strong className="text-dark me-2">{lookupResult.name}</strong>
                <span className="text-muted me-2">Card: <code>{lookupResult.libraryCardId}</code></span>
                <span className="text-muted me-2">Student ID: <strong>{lookupResult.studentId || 'N/A'}</strong></span>
                <span className={`badge ${lookupResult.isActive ? 'bg-success' : 'bg-danger'} me-2`}>
                  {lookupResult.isActive ? 'Active' : 'Deactivated'}
                </span>
              </div>
              <Link to={`/members/${lookupResult._id}`} className="btn btn-sm btn-outline-dark">
                View Member Records →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Section 1: Physical Inventory Holdings */}
      <div className="mb-4">
        <h6 className="fw-bold text-dark text-uppercase small tracking-wide mb-3">
          <i className="bi bi-layers me-2 text-primary"></i>
          Physical Holdings & Circulation
        </h6>
        <div className="row g-3">
          {inventoryCards.map((card, idx) => (
            <div key={idx} className="col-12 col-sm-6 col-xl-2">
              <Link to={card.link} className="text-decoration-none">
                <div className="card h-100 border shadow-sm transition-hover">
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="text-muted small fw-medium text-truncate">{card.title}</span>
                      <div className={`rounded p-1 ${card.bgClass}`} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className={`bi ${card.icon}`}></i>
                      </div>
                    </div>
                    <h4 className="fw-bold text-dark mb-1">{card.value}</h4>
                    <span className="text-muted" style={{ fontSize: '11px' }}>{card.subtext}</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Financial KPIs */}
      <div className="mb-4">
        <h6 className="fw-bold text-dark text-uppercase small tracking-wide mb-3">
          <i className="bi bi-wallet2 me-2 text-success"></i>
          Financial Operations & Revenue
        </h6>
        <div className="row g-3">
          {financialCards.map((card, idx) => (
            <div key={idx} className="col-12 col-sm-6 col-lg-3">
              <Link to={card.link} className="text-decoration-none">
                <div className="card h-100 border shadow-sm transition-hover">
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="text-muted small fw-medium text-truncate">{card.title}</span>
                      <div className={`rounded p-1 ${card.bgClass}`} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className={`bi ${card.icon}`}></i>
                      </div>
                    </div>
                    <h4 className="fw-bold text-dark mb-1">{card.value}</h4>
                    <span className="text-muted" style={{ fontSize: '11px' }}>{card.subtext}</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Recent Inventory Activity Audit Log & Recent Issues */}
      <div className="row g-4 mb-4">
        {/* Recent Inventory Movement Activity */}
        <div className="col-12 col-lg-6">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-semibold text-dark d-flex align-items-center">
                <i className="bi bi-clock-history me-2 text-primary"></i>
                Recent Inventory Activity
              </h6>
              <Link to="/inventory" className="btn btn-sm btn-link text-decoration-none p-0">
                View All
              </Link>
            </div>
            <div className="card-body p-0">
              {stats?.recentInventoryActivity && stats.recentInventoryActivity.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Type</th>
                        <th>Book Title</th>
                        <th className="text-center">Qty</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentInventoryActivity.map((act) => (
                        <tr key={act._id}>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {act.type}
                            </span>
                          </td>
                          <td className="fw-medium text-dark text-truncate" style={{ maxWidth: '160px' }}>
                            {act.book?.title || 'Unknown Title'}
                          </td>
                          <td className="text-center fw-bold">
                            {act.type === 'STOCK_IN' || act.type === 'RETURN' || act.type === 'RECOVERED' ? (
                              <span className="text-success">+{act.quantity}</span>
                            ) : (
                              <span className="text-danger">-{act.quantity}</span>
                            )}
                          </td>
                          <td className="text-muted text-truncate" style={{ maxWidth: '160px' }}>
                            {act.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-center text-muted small">No recent stock movements recorded.</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Issues */}
        <div className="col-12 col-lg-6">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-semibold text-dark d-flex align-items-center">
                <i className="bi bi-journal-text me-2 text-info"></i>
                Recent Circulation Issues
              </h6>
              <Link to="/issues" className="btn btn-sm btn-link text-decoration-none p-0">
                View All
              </Link>
            </div>
            <div className="card-body p-0">
              {stats?.recentIssues?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Book</th>
                        <th>Student</th>
                        <th>Due Date</th>
                        <th className="text-end">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentIssues.map((issue) => (
                        <tr key={issue._id}>
                          <td>
                            <div className="fw-medium text-truncate" style={{ maxWidth: '140px' }}>
                              {issue.book?.title || 'Unknown Title'}
                            </div>
                            <span className="text-muted" style={{ fontSize: '11px' }}>
                              {issue.book?.isbn}
                            </span>
                          </td>
                          <td>
                            <div className="text-truncate" style={{ maxWidth: '120px' }}>{issue.student?.name || 'Unknown'}</div>
                          </td>
                          <td>{formatDate(issue.dueDate)}</td>
                          <td className="text-end">
                            <span
                              className={`badge ${
                                issue.status === 'returned'
                                  ? 'bg-success'
                                  : new Date(issue.dueDate) < new Date()
                                  ? 'bg-danger'
                                  : 'bg-primary'
                              }`}
                            >
                              {issue.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-center text-muted small">No recent issue records.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Overdue Loans Table */}
      <div className="card border shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-semibold text-danger d-flex align-items-center">
            <i className="bi bi-exclamation-octagon me-2"></i>
            Active Overdue Loans Requiring Action
          </h6>
          <Link to="/issues" className="btn btn-sm btn-outline-danger">
            Manage Loans
          </Link>
        </div>
        <div className="card-body p-0">
          {stats?.overdueIssues?.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Book</th>
                    <th>Borrower Student</th>
                    <th>Due Date</th>
                    <th>Days Overdue</th>
                    <th className="text-end">Est. Fine</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.overdueIssues.map((item) => {
                    const diffTime = Math.abs(new Date() - new Date(item.dueDate));
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const estFine = diffDays * 5;

                    return (
                      <tr key={item._id}>
                        <td className="fw-medium text-dark">{item.book?.title}</td>
                        <td>
                          <div>{item.student?.name}</div>
                          <span className="text-muted" style={{ fontSize: '11px' }}>
                            {item.student?.studentId} • {item.student?.phone || 'No phone'}
                          </span>
                        </td>
                        <td>{formatDate(item.dueDate)}</td>
                        <td>
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                            {diffDays} day(s) late
                          </span>
                        </td>
                        <td className="text-end fw-semibold text-danger">₹{estFine}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-center text-muted small">
              <i className="bi bi-check2-circle text-success fs-4 d-block mb-1"></i>
              No overdue loans. All books are returned on time or within due dates.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
