import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService';
import { categoryService } from '../services/categoryService';
import Pagination from '../components/common/Pagination';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';

const Inventory = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [inventoryItems, setInventoryItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(
    searchParams.get('status') || 'all'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Stock Action Modal State
  // modalAction: 'STOCK_IN' | 'DAMAGE' | 'LOST' | 'RECOVER' | 'ADJUST' | 'PHYSICAL_CHECK'
  const [activeItem, setActiveItem] = useState(null);
  const [modalAction, setModalAction] = useState(null);
  const [actionQuantity, setActionQuantity] = useState(1);
  const [actionReason, setActionReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('increase');
  const [physicalCountInput, setPhysicalCountInput] = useState(0);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Fetch Inventory Data
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit: 10,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus;

      const [invRes, statsRes, catRes] = await Promise.all([
        inventoryService.getInventory(params),
        inventoryService.getInventoryStats(),
        categoryService.getCategories(),
      ]);

      if (invRes.success) {
        setInventoryItems(invRes.data || []);
        setTotalPages(invRes.totalPages || 1);
        setTotalItems(invRes.total || 0);
      }
      if (statsRes.success) setStats(statsRes.data);
      if (catRes.success) setCategories(catRes.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load inventory records. Please check backend connection.'
      );
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedStatus, currentPage]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Handle Action Modal Open
  const openActionModal = (item, action) => {
    setActiveItem(item);
    setModalAction(action);
    setActionQuantity(1);
    setActionReason('');
    setAdjustmentType('increase');
    setPhysicalCountInput(item.availableCopies || 0);
  };

  const closeActionModal = () => {
    setActiveItem(null);
    setModalAction(null);
    setActionReason('');
  };

  // Submit Inventory Action
  const handleSubmitAction = async (e) => {
    e.preventDefault();
    if (!activeItem) return;

    setIsSubmittingAction(true);
    setError('');
    setSuccessMessage('');

    try {
      const bookId = activeItem.book?._id || activeItem.book;
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
        setSuccessMessage(res.message || 'Inventory updated successfully.');
        closeActionModal();
        fetchInventory();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to complete stock operation.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getStatusBadge = (inv) => {
    if (inv.availableCopies === 0) {
      return (
        <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
          <i className="bi bi-x-circle me-1"></i> Out of Stock
        </span>
      );
    }
    if (inv.availableCopies <= (inv.lowStockThreshold || 2)) {
      return (
        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">
          <i className="bi bi-exclamation-triangle me-1"></i> Low Stock ({inv.availableCopies})
        </span>
      );
    }
    return (
      <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
        <i className="bi bi-check-circle me-1"></i> In Stock ({inv.availableCopies})
      </span>
    );
  };

  const getCoverUrl = (image) => {
    if (!image) return null;
    return image.startsWith('http') ? image : `http://localhost:5000${image}`;
  };

  const kpiCards = [
    { title: 'Total Books', value: stats?.totalBooks || 0, icon: 'bi-book', bg: 'bg-primary-subtle text-primary border-primary-subtle' },
    { title: 'Physical Copies', value: stats?.totalCopies || 0, icon: 'bi-layers', bg: 'bg-secondary-subtle text-secondary border-secondary-subtle' },
    { title: 'Available', value: stats?.availableCopies || 0, icon: 'bi-check2-circle', bg: 'bg-success-subtle text-success border-success-subtle' },
    { title: 'On Loan (Issued)', value: stats?.issuedCopies || 0, icon: 'bi-journal-arrow-up', bg: 'bg-info-subtle text-info border-info-subtle' },
    { title: 'Damaged', value: stats?.damagedCopies || 0, icon: 'bi-tools', bg: 'bg-warning-subtle text-warning-emphasis border-warning-subtle' },
    { title: 'Lost', value: stats?.lostCopies || 0, icon: 'bi-question-diamond', bg: 'bg-danger-subtle text-danger border-danger-subtle' },
    { title: 'Low Stock (< 3)', value: stats?.lowStockCount || 0, icon: 'bi-exclamation-octagon', bg: 'bg-warning-subtle text-warning-emphasis border-warning-subtle' },
    { title: 'Out of Stock', value: stats?.outOfStockCount || 0, icon: 'bi-slash-circle', bg: 'bg-danger-subtle text-danger border-danger-subtle' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1">Advanced Inventory Management</h3>
          <p className="text-muted small mb-0">
            Physical book holdings, circulation stock, damage tracking, and movement audit logs
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/inventory/reports" className="btn btn-outline-secondary btn-sm d-flex align-items-center">
            <i className="bi bi-file-earmark-spreadsheet me-1"></i> Inventory Reports
          </Link>
          <Link to="/books/add" className="btn btn-primary btn-sm d-flex align-items-center">
            <i className="bi bi-plus-lg me-1"></i> Add New Book
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2 fs-5"></i>
          <div>{successMessage}</div>
          <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={fetchInventory} />}

      {/* KPI Stats Grid */}
      <div className="row g-3 mb-4">
        {kpiCards.map((c, i) => (
          <div key={i} className="col-6 col-md-3 col-xl">
            <div className="card h-100 border shadow-sm">
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-muted small fw-medium text-truncate">{c.title}</span>
                  <i className={`bi ${c.icon} text-secondary`}></i>
                </div>
                <h4 className="fw-bold text-dark mb-0">{c.value.toLocaleString()}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="card border shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search Input */}
            <div className="col-12 col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by book title, author, or ISBN..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="col-12 col-sm-6 col-md-3">
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Total Results Counter */}
            <div className="col-12 col-sm-6 col-md-4 text-sm-end text-muted small">
              Total Managed Titles: <strong>{totalItems}</strong>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="d-flex flex-wrap gap-2 mt-3 pt-3 border-top">
            {[
              { id: 'all', label: 'All Catalog' },
              { id: 'in_stock', label: 'In Stock' },
              { id: 'low_stock', label: 'Low Stock' },
              { id: 'out_of_stock', label: 'Out of Stock' },
              { id: 'damaged', label: 'Has Damaged Copies' },
              { id: 'lost', label: 'Has Lost Copies' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`btn btn-sm ${
                  selectedStatus === tab.id
                    ? 'btn-primary text-dark fw-semibold'
                    : 'btn-outline-secondary'
                }`}
                onClick={() => {
                  setSelectedStatus(tab.id);
                  setSearchParams({ status: tab.id });
                  setCurrentPage(1);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card border shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <Loading message="Loading physical inventory records..." />
          ) : inventoryItems.length > 0 ? (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 bg-white small">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" style={{ width: '4%' }}>#</th>
                      <th scope="col" style={{ width: '6%' }}>Cover</th>
                      <th scope="col" style={{ width: '26%' }}>Book Specifications</th>
                      <th scope="col" style={{ width: '12%' }}>Category</th>
                      <th scope="col" className="text-center" style={{ width: '7%' }}>Total</th>
                      <th scope="col" className="text-center" style={{ width: '8%' }}>Available</th>
                      <th scope="col" className="text-center" style={{ width: '7%' }}>Issued</th>
                      <th scope="col" className="text-center" style={{ width: '7%' }}>Damaged</th>
                      <th scope="col" className="text-center" style={{ width: '6%' }}>Lost</th>
                      <th scope="col" className="text-center" style={{ width: '8%' }}>Status</th>
                      <th scope="col" className="text-end" style={{ width: '9%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryItems.map((inv, idx) => {
                      const book = inv.book || {};
                      const coverUrl = getCoverUrl(book.image);

                      return (
                        <tr key={inv._id}>
                          <td className="text-muted">{(currentPage - 1) * 10 + idx + 1}</td>
                          <td>
                            <div
                              className="bg-light rounded border d-flex align-items-center justify-content-center overflow-hidden shadow-sm"
                              style={{ width: '38px', height: '50px' }}
                            >
                              {coverUrl ? (
                                <img
                                  src={coverUrl}
                                  alt={book.title}
                                  className="w-100 h-100 object-fit-cover"
                                />
                              ) : (
                                <i className="bi bi-book text-muted"></i>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '240px' }} title={book.title}>
                              {book.title || 'Untitled Book'}
                            </div>
                            <span className="text-muted" style={{ fontSize: '11px' }}>
                              ISBN: <code>{book.isbn || '—'}</code> • By {book.author || 'Unknown'}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {book.category?.name || 'General'}
                            </span>
                          </td>
                          <td className="text-center fw-bold text-dark">{inv.totalCopies}</td>
                          <td className="text-center fw-bold text-success fs-6">{inv.availableCopies}</td>
                          <td className="text-center text-primary fw-medium">{inv.issuedCopies}</td>
                          <td className="text-center text-warning-emphasis fw-medium">
                            {inv.damagedCopies > 0 ? (
                              <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                                {inv.damagedCopies}
                              </span>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td className="text-center text-danger fw-medium">
                            {inv.lostCopies > 0 ? (
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                                {inv.lostCopies}
                              </span>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td className="text-center">{getStatusBadge(inv)}</td>
                          <td className="text-end">
                            <div className="dropdown">
                              <button
                                className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                Manage
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end shadow-sm small">
                                <li>
                                  <Link className="dropdown-item" to={`/inventory/${book._id}`}>
                                    <i className="bi bi-clock-history me-2 text-primary"></i>
                                    View Movement Audit Log
                                  </Link>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                  <button
                                    className="dropdown-item"
                                    type="button"
                                    onClick={() => openActionModal(inv, 'STOCK_IN')}
                                  >
                                    <i className="bi bi-plus-circle me-2 text-success"></i>
                                    Add Stock (Stock In)
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item"
                                    type="button"
                                    onClick={() => openActionModal(inv, 'DAMAGE')}
                                    disabled={inv.availableCopies === 0}
                                  >
                                    <i className="bi bi-tools me-2 text-warning"></i>
                                    Mark as Damaged
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item"
                                    type="button"
                                    onClick={() => openActionModal(inv, 'LOST')}
                                    disabled={inv.availableCopies === 0}
                                  >
                                    <i className="bi bi-question-circle me-2 text-danger"></i>
                                    Mark as Lost
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item"
                                    type="button"
                                    onClick={() => openActionModal(inv, 'RECOVER')}
                                    disabled={inv.lostCopies === 0}
                                  >
                                    <i className="bi bi-arrow-counterclockwise me-2 text-info"></i>
                                    Recover Lost Copy
                                  </button>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                  <button
                                    className="dropdown-item"
                                    type="button"
                                    onClick={() => openActionModal(inv, 'ADJUST')}
                                  >
                                    <i className="bi bi-sliders me-2 text-secondary"></i>
                                    Stock Count Adjustment
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item"
                                    type="button"
                                    onClick={() => openActionModal(inv, 'PHYSICAL_CHECK')}
                                  >
                                    <i className="bi bi-clipboard-check me-2 text-primary"></i>
                                    Physical Stock Verification
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-3 border-top">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={10}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon="bi-box-seam"
              title="No inventory records found"
              description="No physical stock records matched your selected criteria."
            />
          )}
        </div>
      </div>

      {/* Stock Movement Action Modal */}
      {modalAction && activeItem && (
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
                    onClick={closeActionModal}
                    disabled={isSubmittingAction}
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="bg-light p-3 rounded mb-3 small">
                    <div className="fw-semibold text-dark fs-6 mb-1">{activeItem.book?.title}</div>
                    <div className="text-muted">
                      ISBN: {activeItem.book?.isbn} • Total Copies: <strong>{activeItem.totalCopies}</strong> • Available: <strong className="text-success">{activeItem.availableCopies}</strong>
                    </div>
                  </div>

                  {/* Stock In / Damage / Lost / Recover: Quantity Field */}
                  {modalAction !== 'PHYSICAL_CHECK' && modalAction !== 'ADJUST' && (
                    <div className="mb-3">
                      <label className="form-label fw-medium small">Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        max={
                          modalAction === 'DAMAGE' || modalAction === 'LOST'
                            ? activeItem.availableCopies
                            : modalAction === 'RECOVER'
                            ? activeItem.lostCopies
                            : 9999
                        }
                        value={actionQuantity}
                        onChange={(e) => setActionQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        required
                      />
                      <div className="form-text small">
                        {modalAction === 'STOCK_IN' && 'Number of newly procured copies to add to circulating inventory.'}
                        {modalAction === 'DAMAGE' && `Cannot exceed currently available copies (${activeItem.availableCopies}).`}
                        {modalAction === 'LOST' && `Cannot exceed currently available copies (${activeItem.availableCopies}).`}
                        {modalAction === 'RECOVER' && `Cannot exceed currently recorded lost copies (${activeItem.lostCopies}).`}
                      </div>
                    </div>
                  )}

                  {/* Adjust Stock Mode */}
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
                          max={adjustmentType === 'decrease' ? activeItem.availableCopies : 9999}
                          value={actionQuantity}
                          onChange={(e) => setActionQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* Physical Check Mode */}
                  {modalAction === 'PHYSICAL_CHECK' && (
                    <div className="mb-3">
                      <label className="form-label fw-medium small">Physical Count Verification</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        value={physicalCountInput}
                        onChange={(e) => setPhysicalCountInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        required
                      />
                      <div className="form-text small">
                        System shows <strong>{activeItem.availableCopies}</strong> available copies. Enter the physical count found on library shelves.
                        {physicalCountInput !== activeItem.availableCopies && (
                          <span className="d-block text-primary fw-medium mt-1">
                            Discrepancy: {physicalCountInput - activeItem.availableCopies > 0 ? '+' : ''}{physicalCountInput - activeItem.availableCopies} copy(ies).
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reason Field */}
                  <div className="mb-3">
                    <label className="form-label fw-medium small">Audit Reason / Note <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Provide an audit justification for this stock transaction..."
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
                    onClick={closeActionModal}
                    disabled={isSubmittingAction}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm text-dark fw-semibold"
                    disabled={isSubmittingAction || !actionReason.trim()}
                  >
                    {isSubmittingAction ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Recording...
                      </>
                    ) : (
                      'Confirm & Record Movement'
                    )}
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

export default Inventory;
