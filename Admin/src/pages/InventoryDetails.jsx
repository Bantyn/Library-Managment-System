import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import Pagination from '../components/common/Pagination';
import { formatDateTime } from '../utils/formatDate';

const InventoryDetails = () => {
  const { bookId } = useParams();

  const [inventory, setInventory] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Pagination for transactions
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

  // Quick Action Modal State
  const [modalAction, setModalAction] = useState(null);
  const [actionQuantity, setActionQuantity] = useState(1);
  const [actionReason, setActionReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('increase');
  const [physicalCountInput, setPhysicalCountInput] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBookInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [invRes, transRes] = await Promise.all([
        inventoryService.getBookInventory(bookId),
        inventoryService.getBookTransactions(bookId, {
          page: currentPage,
          limit: 10,
        }),
      ]);

      if (invRes.success) setInventory(invRes.data);
      if (transRes.success) {
        setTransactions(transRes.data || []);
        setTotalPages(transRes.totalPages || 1);
        setTotalTransactions(transRes.total || 0);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load book inventory audit history.'
      );
    } finally {
      setLoading(false);
    }
  }, [bookId, currentPage]);

  useEffect(() => {
    fetchBookInventory();
  }, [fetchBookInventory]);

  // Handle Action Submit
  const handleSubmitAction = async (e) => {
    e.preventDefault();
    if (!inventory) return;

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      let res;
      if (modalAction === 'STOCK_IN') {
        res = await inventoryService.stockIn(bookId, {
          quantity: actionQuantity,
          reason: actionReason,
        });
      } else if (modalAction === 'DAMAGE') {
        res = await inventoryService.markDamage(bookId, {
          quantity: actionQuantity,
          reason: actionReason,
        });
      } else if (modalAction === 'LOST') {
        res = await inventoryService.markLost(bookId, {
          quantity: actionQuantity,
          reason: actionReason,
        });
      } else if (modalAction === 'RECOVER') {
        res = await inventoryService.recoverLost(bookId, {
          quantity: actionQuantity,
          reason: actionReason,
        });
      } else if (modalAction === 'ADJUST') {
        res = await inventoryService.adjustStock(bookId, {
          adjustmentType,
          quantity: actionQuantity,
          reason: actionReason,
        });
      } else if (modalAction === 'PHYSICAL_CHECK') {
        res = await inventoryService.physicalStockCheck(bookId, {
          physicalCount: physicalCountInput,
          reason: actionReason,
        });
      }

      if (res && res.success) {
        setSuccessMessage(res.message || 'Inventory movement recorded successfully.');
        setModalAction(null);
        setActionReason('');
        fetchBookInventory();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to complete transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTransactionBadge = (type) => {
    switch (type) {
      case 'STOCK_IN':
        return <span className="badge bg-success-subtle text-success border border-success-subtle"><i className="bi bi-box-arrow-in-down me-1"></i> STOCK IN</span>;
      case 'STOCK_OUT':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle"><i className="bi bi-box-arrow-up me-1"></i> STOCK OUT (SALE)</span>;
      case 'ISSUE':
        return <span className="badge bg-info-subtle text-info border border-info-subtle"><i className="bi bi-arrow-up-right me-1"></i> CIRCULATION ISSUE</span>;
      case 'RETURN':
        return <span className="badge bg-primary-subtle text-primary border-primary-subtle"><i className="bi bi-arrow-down-left me-1"></i> CIRCULATION RETURN</span>;
      case 'DAMAGE':
        return <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle"><i className="bi bi-tools me-1"></i> DAMAGED</span>;
      case 'LOST':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle"><i className="bi bi-question-circle me-1"></i> LOST</span>;
      case 'RECOVERED':
        return <span className="badge bg-success-subtle text-success border border-success-subtle"><i className="bi bi-arrow-counterclockwise me-1"></i> RECOVERED</span>;
      case 'ADJUSTMENT':
        return <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle"><i className="bi bi-sliders me-1"></i> ADJUSTMENT</span>;
      default:
        return <span className="badge bg-light text-dark border">{type}</span>;
    }
  };

  if (loading && !inventory) {
    return <Loading message="Loading inventory audit details..." />;
  }

  if (error && !inventory) {
    return <ErrorMessage message={error} onRetry={fetchBookInventory} />;
  }

  const book = inventory?.book || {};
  const coverUrl = book.image
    ? book.image.startsWith('http')
      ? book.image
      : `http://localhost:5000${book.image}`
    : null;

  return (
    <div>
      {/* Breadcrumb & Navigation */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0 small">
            <li className="breadcrumb-item">
              <Link to="/inventory">Inventory</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {book.title || 'Book Details'}
            </li>
          </ol>
        </nav>
        <Link to="/inventory" className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-left me-1"></i> Back to Inventory
        </Link>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2 fs-5"></i>
          <div>{successMessage}</div>
          <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {/* Book Metadata & Actions Bar */}
      <div className="card border shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="row g-4 align-items-center">
            {/* Book Cover Thumbnail */}
            <div className="col-auto">
              <div
                className="bg-light rounded border d-flex align-items-center justify-content-center overflow-hidden shadow-sm"
                style={{ width: '80px', height: '110px' }}
              >
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={book.title}
                    className="w-100 h-100 object-fit-cover"
                  />
                ) : (
                  <i className="bi bi-book text-muted fs-1"></i>
                )}
              </div>
            </div>

            {/* Book Info */}
            <div className="col">
              <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                <h4 className="fw-bold text-dark mb-0">{book.title}</h4>
                <span className="badge bg-light text-dark border">
                  {book.category?.name || 'General'}
                </span>
                {inventory.availableCopies === 0 ? (
                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                    Out of Stock
                  </span>
                ) : inventory.availableCopies <= (inventory.lowStockThreshold || 2) ? (
                  <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                    Low Stock Alert
                  </span>
                ) : (
                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                    Healthy Stock
                  </span>
                )}
              </div>
              <p className="text-muted small mb-2">
                By <strong>{book.author}</strong> • ISBN: <code>{book.isbn}</code>
                {book.publisher && ` • ${book.publisher}`}
                {book.shelfLocation && ` • Shelf: ${book.shelfLocation}`}
              </p>
              <div className="d-flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm"
                  onClick={() => {
                    setModalAction('STOCK_IN');
                    setActionQuantity(1);
                    setActionReason('');
                  }}
                >
                  <i className="bi bi-plus-circle me-1"></i> Add Stock
                </button>
                <button
                  type="button"
                  className="btn btn-outline-warning btn-sm"
                  onClick={() => {
                    setModalAction('DAMAGE');
                    setActionQuantity(1);
                    setActionReason('');
                  }}
                  disabled={inventory.availableCopies === 0}
                >
                  <i className="bi bi-tools me-1"></i> Mark Damaged
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => {
                    setModalAction('LOST');
                    setActionQuantity(1);
                    setActionReason('');
                  }}
                  disabled={inventory.availableCopies === 0}
                >
                  <i className="bi bi-question-circle me-1"></i> Mark Lost
                </button>
                <button
                  type="button"
                  className="btn btn-outline-info btn-sm"
                  onClick={() => {
                    setModalAction('RECOVER');
                    setActionQuantity(1);
                    setActionReason('');
                  }}
                  disabled={inventory.lostCopies === 0}
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i> Recover
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setModalAction('ADJUST');
                    setActionQuantity(1);
                    setActionReason('');
                  }}
                >
                  <i className="bi bi-sliders me-1"></i> Adjust Stock
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => {
                    setModalAction('PHYSICAL_CHECK');
                    setPhysicalCountInput(inventory.availableCopies);
                    setActionReason('');
                  }}
                >
                  <i className="bi bi-clipboard-check me-1"></i> Physical Count Check
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Holdings Breakdown Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border shadow-sm text-center p-3">
            <span className="text-muted small fw-medium">Total Copies</span>
            <h3 className="fw-bold text-dark mt-1 mb-0">{inventory.totalCopies}</h3>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border shadow-sm text-center p-3">
            <span className="text-muted small fw-medium">Available</span>
            <h3 className="fw-bold text-success mt-1 mb-0">{inventory.availableCopies}</h3>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border shadow-sm text-center p-3">
            <span className="text-muted small fw-medium">On Loan (Issued)</span>
            <h3 className="fw-bold text-primary mt-1 mb-0">{inventory.issuedCopies}</h3>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border shadow-sm text-center p-3">
            <span className="text-muted small fw-medium">Damaged Copies</span>
            <h3 className="fw-bold text-warning-emphasis mt-1 mb-0">{inventory.damagedCopies}</h3>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border shadow-sm text-center p-3">
            <span className="text-muted small fw-medium">Lost Copies</span>
            <h3 className="fw-bold text-danger mt-1 mb-0">{inventory.lostCopies}</h3>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border shadow-sm text-center p-3">
            <span className="text-muted small fw-medium">Alert Threshold</span>
            <h3 className="fw-bold text-secondary mt-1 mb-0">{inventory.lowStockThreshold || 2}</h3>
          </div>
        </div>
      </div>

      {/* Inventory Movement History Audit Trail Table */}
      <div className="card border shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="fw-bold text-dark mb-0">Inventory Movement History (Audit Trail)</h5>
            <small className="text-muted">
              Complete chronological audit trail of all physical stock receipts, loans, returns, and damages
            </small>
          </div>
          <span className="badge bg-light text-dark border">
            {totalTransactions} Total Movements Logged
          </span>
        </div>

        <div className="card-body p-0">
          {transactions.length > 0 ? (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 bg-white small">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" style={{ width: '16%' }}>Date & Time</th>
                      <th scope="col" style={{ width: '18%' }}>Transaction Type</th>
                      <th scope="col" className="text-center" style={{ width: '8%' }}>Qty</th>
                      <th scope="col" className="text-center" style={{ width: '14%' }}>Stock Before → After</th>
                      <th scope="col" style={{ width: '26%' }}>Audit Reason</th>
                      <th scope="col" style={{ width: '18%' }}>Performed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t._id}>
                        <td className="text-muted">
                          {formatDateTime(t.createdAt)}
                        </td>
                        <td>{getTransactionBadge(t.type)}</td>
                        <td className="text-center fw-bold">
                          {t.type === 'STOCK_IN' || t.type === 'RETURN' || t.type === 'RECOVERED' ? (
                            <span className="text-success">+{t.quantity}</span>
                          ) : t.type === 'ADJUSTMENT' ? (
                            t.newAvailable > t.previousAvailable ? (
                              <span className="text-success">+{t.quantity}</span>
                            ) : (
                              <span className="text-danger">-{t.quantity}</span>
                            )
                          ) : (
                            <span className="text-danger">-{t.quantity}</span>
                          )}
                        </td>
                        <td className="text-center">
                          <code>{t.previousAvailable}</code>
                          <i className="bi bi-arrow-right mx-2 text-muted"></i>
                          <strong className="text-dark">{t.newAvailable}</strong>
                        </td>
                        <td>
                          <span className="text-dark fw-medium">{t.reason}</span>
                          {t.referenceId && (
                            <div className="text-muted" style={{ fontSize: '10px' }}>
                              Ref: <code>{t.referenceId}</code>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="fw-medium text-dark">{t.performedBy?.name || 'System Administrator'}</div>
                          <small className="text-muted" style={{ fontSize: '11px' }}>
                            {t.performedBy?.email}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 border-top">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalTransactions}
                  pageSize={10}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-muted">
              <i className="bi bi-clock-history fs-3 d-block mb-2"></i>
              No movement history recorded yet for this book.
            </div>
          )}
        </div>
      </div>

      {/* Stock Action Modal */}
      {modalAction && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmitAction}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold text-dark">
                    {modalAction === 'STOCK_IN' && 'Add Physical Stock (Stock In)'}
                    {modalAction === 'DAMAGE' && 'Record Damaged Book Copies'}
                    {modalAction === 'LOST' && 'Record Lost Book Copies'}
                    {modalAction === 'RECOVER' && 'Recover Lost Book Copies'}
                    {modalAction === 'ADJUST' && 'Administrative Inventory Adjustment'}
                    {modalAction === 'PHYSICAL_CHECK' && 'Physical Stock Count Reconciliation'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setModalAction(null)}
                    disabled={isSubmitting}
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="bg-light p-3 rounded mb-3 small">
                    <div className="fw-semibold text-dark fs-6 mb-1">{book.title}</div>
                    <div className="text-muted">
                      Total Copies: <strong>{inventory.totalCopies}</strong> • Available: <strong className="text-success">{inventory.availableCopies}</strong>
                    </div>
                  </div>

                  {modalAction !== 'PHYSICAL_CHECK' && modalAction !== 'ADJUST' && (
                    <div className="mb-3">
                      <label className="form-label fw-medium small">Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        max={
                          modalAction === 'DAMAGE' || modalAction === 'LOST'
                            ? inventory.availableCopies
                            : modalAction === 'RECOVER'
                            ? inventory.lostCopies
                            : 9999
                        }
                        value={actionQuantity}
                        onChange={(e) => setActionQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        required
                      />
                    </div>
                  )}

                  {modalAction === 'ADJUST' && (
                    <>
                      <div className="mb-3">
                        <label className="form-label fw-medium small">Adjustment Type</label>
                        <select
                          className="form-select"
                          value={adjustmentType}
                          onChange={(e) => setAdjustmentType(e.target.value)}
                        >
                          <option value="increase">Increase Available Stock (+)</option>
                          <option value="decrease">Decrease Available Stock (-)</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-medium small">Quantity</label>
                        <input
                          type="number"
                          className="form-control"
                          min="1"
                          max={adjustmentType === 'decrease' ? inventory.availableCopies : 9999}
                          value={actionQuantity}
                          onChange={(e) => setActionQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          required
                        />
                      </div>
                    </>
                  )}

                  {modalAction === 'PHYSICAL_CHECK' && (
                    <div className="mb-3">
                      <label className="form-label fw-medium small">Physical Count</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        value={physicalCountInput}
                        onChange={(e) => setPhysicalCountInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        required
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-medium small">Audit Reason / Justification <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Enter justification for audit log..."
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setModalAction(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm text-dark fw-semibold"
                    disabled={isSubmitting || !actionReason.trim()}
                  >
                    {isSubmitting ? 'Saving...' : 'Confirm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryDetails;
