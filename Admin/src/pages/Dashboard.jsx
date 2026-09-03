import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { formatDate } from '../utils/formatDate';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      title: 'Total Books',
      value: stats?.totalBooks || 0,
      icon: 'bi-book',
      bgClass: 'bg-primary-subtle text-primary border-primary-subtle',
      subtext: `${stats?.totalTitles || 0} unique titles`,
    },
    {
      title: 'Available Books',
      value: stats?.availableBooks || 0,
      icon: 'bi-check-circle',
      bgClass: 'bg-success-subtle text-success border-success-subtle',
      subtext: 'In circulation stock',
    },
    {
      title: 'Issued Books',
      value: stats?.issuedBooks || 0,
      icon: 'bi-journal-arrow-up',
      bgClass: 'bg-info-subtle text-info border-info-subtle',
      subtext: 'Currently on loan',
    },
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: 'bi-people',
      bgClass: 'bg-secondary-subtle text-secondary border-secondary-subtle',
      subtext: 'Registered members',
    },
    {
      title: 'Overdue Books',
      value: stats?.overdueBooks || 0,
      icon: 'bi-exclamation-triangle',
      bgClass: 'bg-danger-subtle text-danger border-danger-subtle',
      subtext: 'Pending late return',
    },
    {
      title: 'Categories',
      value: stats?.totalCategories || 0,
      icon: 'bi-tags',
      bgClass: 'bg-warning-subtle text-warning border-warning-subtle',
      subtext: 'Subject classifications',
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
            Real-time circulation metrics, student sales, and fine collections
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/issues/issue-book" className="btn btn-primary btn-sm d-flex align-items-center">
            <i className="bi bi-journal-plus me-1"></i> Issue Book
          </Link>
          <Link to="/books/add" className="btn btn-outline-primary btn-sm d-flex align-items-center">
            <i className="bi bi-plus-lg me-1"></i> Add Book
          </Link>
        </div>
      </div>

      {/* Inventory KPI Cards Grid */}
      <div className="row g-3 mb-4">
        {inventoryCards.map((card, idx) => (
          <div key={idx} className="col-12 col-sm-6 col-lg-4 col-xl-2">
            <div className="card h-100 border shadow-sm">
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted small fw-medium">{card.title}</span>
                  <div
                    className={`rounded p-2 d-flex align-items-center justify-content-center border ${card.bgClass}`}
                    style={{ width: '36px', height: '36px' }}
                  >
                    <i className={`bi ${card.icon} fs-5`}></i>
                  </div>
                </div>
                <h3 className="fw-bold text-dark mb-1">
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </h3>
                <div className="text-muted small" style={{ fontSize: '11px' }}>
                  {card.subtext}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Financial & Razorpay KPI Cards (Phase 5) */}
      <div className="row g-3 mb-4">
        {financialCards.map((card, idx) => (
          <div key={idx} className="col-12 col-sm-6 col-lg-3">
            <Link to={card.link} className="text-decoration-none">
              <div className="card h-100 border shadow-sm hover-elevate">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted small fw-medium">{card.title}</span>
                    <div
                      className={`rounded p-2 d-flex align-items-center justify-content-center border ${card.bgClass}`}
                      style={{ width: '36px', height: '36px' }}
                    >
                      <i className={`bi ${card.icon} fs-5`}></i>
                    </div>
                  </div>
                  <h3 className="fw-bold text-dark mb-1">{card.value}</h3>
                  <div className="d-flex justify-content-between align-items-center text-muted small" style={{ fontSize: '11px' }}>
                    <span>{card.subtext}</span>
                    <span className="text-primary fw-medium">View →</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Dashboard Tables Section */}
      <div className="row g-4 mb-4">
        {/* Recent Issues */}
        <div className="col-12 col-lg-6">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-semibold text-dark d-flex align-items-center">
                <i className="bi bi-journal-text me-2 text-primary"></i>
                Recent Issues
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
                            <div className="fw-medium text-truncate" style={{ maxWidth: '160px' }}>
                              {issue.book?.title || 'Unknown Title'}
                            </div>
                            <span className="text-muted" style={{ fontSize: '11px' }}>
                              {issue.book?.isbn}
                            </span>
                          </td>
                          <td>
                            <div>{issue.student?.name || 'Unknown Student'}</div>
                            <span className="text-muted" style={{ fontSize: '11px' }}>
                              {issue.student?.studentId}
                            </span>
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

        {/* Recently Added Books */}
        <div className="col-12 col-lg-6">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-semibold text-dark d-flex align-items-center">
                <i className="bi bi-book me-2 text-success"></i>
                Recently Added Books
              </h6>
              <Link to="/books" className="btn btn-sm btn-link text-decoration-none p-0">
                View All
              </Link>
            </div>
            <div className="card-body p-0">
              {stats?.recentBooks?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Category</th>
                        <th className="text-center">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentBooks.map((book) => (
                        <tr key={book._id}>
                          <td>
                            <div className="fw-medium text-truncate" style={{ maxWidth: '180px' }}>
                              {book.title}
                            </div>
                          </td>
                          <td className="text-secondary">{book.author}</td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {book.category?.name || 'General'}
                            </span>
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge ${
                                book.availableCopies > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                              }`}
                            >
                              {book.availableCopies} / {book.totalCopies}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-center text-muted small">No books in catalog yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Alerts Section */}
      <div className="card border shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-semibold text-danger d-flex align-items-center">
            <i className="bi bi-exclamation-octagon me-2"></i>
            Overdue Loans Requiring Attention
          </h6>
          <Link to="/issues/overdue" className="btn btn-sm btn-outline-danger">
            View All Overdue
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
