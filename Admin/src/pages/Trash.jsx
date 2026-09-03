import React, { useState, useEffect, useCallback } from 'react';
import { trashService } from '../services/trashService';
import { bookService } from '../services/bookService';
import { categoryService } from '../services/categoryService';
import { memberService } from '../services/memberService';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import ConfirmModal from '../components/common/ConfirmModal';
import HardDeleteModal from '../components/common/HardDeleteModal';
import Pagination from '../components/common/Pagination';

const TABS = [
  { key: 'books', label: 'Books', icon: 'bi-book' },
  { key: 'categories', label: 'Categories', icon: 'bi-tags' },
  { key: 'members', label: 'Members', icon: 'bi-people' },
];

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const Trash = () => {
  const [activeTab, setActiveTab] = useState('books');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState({ books: 0, categories: 0, members: 0 });

  // Restore modal state
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Hard delete modal state
  const [hardDeleteTarget, setHardDeleteTarget] = useState(null);
  const [isHardDeleting, setIsHardDeleting] = useState(false);
  const [hardDeleteError, setHardDeleteError] = useState('');

  // Load trash summary counts
  const loadSummary = useCallback(async () => {
    try {
      const res = await trashService.getTrashSummary();
      if (res.success) setSummary(res.data);
    } catch (e) {
      /* summary is non-critical */
    }
  }, []);

  // Load trash items
  const fetchTrash = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await trashService.getTrash({ type: activeTab, page: currentPage, limit: 15 });
      if (res.success) {
        setItems(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalItems(res.total || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load trash records.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage]);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setError('');
    setSuccessMessage('');
  };

  // === RESTORE ===
  const handleRestorePrompt = (item) => setRestoreTarget(item);

  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;
    setIsRestoring(true);
    try {
      let res;
      if (activeTab === 'books') res = await bookService.restoreBook(restoreTarget._id);
      else if (activeTab === 'categories') res = await categoryService.restoreCategory(restoreTarget._id);
      else res = await memberService.restoreMember(restoreTarget._id);

      if (res.success) {
        setSuccessMessage(`"${restoreTarget.title || restoreTarget.name}" restored successfully.`);
        setRestoreTarget(null);
        fetchTrash();
        loadSummary();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to restore record.');
      setRestoreTarget(null);
    } finally {
      setIsRestoring(false);
    }
  };

  // === HARD DELETE ===
  const handleHardDeletePrompt = (item) => {
    setHardDeleteError('');
    setHardDeleteTarget(item);
  };

  const handleConfirmHardDelete = async () => {
    if (!hardDeleteTarget) return;
    setIsHardDeleting(true);
    setHardDeleteError('');
    try {
      let res;
      if (activeTab === 'books') res = await bookService.hardDeleteBook(hardDeleteTarget._id);
      else if (activeTab === 'categories') res = await categoryService.hardDeleteCategory(hardDeleteTarget._id);
      else res = await memberService.hardDeleteMember(hardDeleteTarget._id);

      if (res.success) {
        setSuccessMessage(`"${hardDeleteTarget.title || hardDeleteTarget.name}" permanently deleted.`);
        setHardDeleteTarget(null);
        fetchTrash();
        loadSummary();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Permanent delete failed.';
      setHardDeleteError(msg);
      // Keep modal open so user sees the dependency error
    } finally {
      setIsHardDeleting(false);
    }
  };

  const getItemName = (item) => {
    if (!item) return '';
    return item.title || item.name || `ID: ${item._id}`;
  };

  // === RENDER TABLE BY TYPE ===
  const renderBooksTable = () => (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0 small">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Author</th>
            <th>ISBN</th>
            <th>Category</th>
            <th>Deleted At</th>
            <th>Deleted By</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((book, i) => (
            <tr key={book._id}>
              <td className="text-muted">{(currentPage - 1) * 15 + i + 1}</td>
              <td>
                <div className="fw-semibold text-dark">{book.title}</div>
                <small className="text-muted">{book.publisher || ''}</small>
              </td>
              <td>{book.author}</td>
              <td><code className="small">{book.isbn}</code></td>
              <td>{book.category?.name || '—'}</td>
              <td><span className="text-muted">{formatDate(book.deletedAt)}</span></td>
              <td>{book.deletedBy?.name || '—'}</td>
              <td className="text-end">
                <div className="d-flex justify-content-end gap-2 flex-wrap">
                  <button
                    className="btn btn-sm btn-outline-success d-flex align-items-center"
                    onClick={() => handleRestorePrompt(book)}
                  >
                    <i className="bi bi-arrow-counterclockwise me-1"></i> Restore
                  </button>
                  <button
                    className="btn btn-sm btn-danger d-flex align-items-center"
                    onClick={() => handleHardDeletePrompt(book)}
                  >
                    <i className="bi bi-trash3 me-1"></i> Delete Permanently
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCategoriesTable = () => (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0 small">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Category Name</th>
            <th>Description</th>
            <th>Deleted At</th>
            <th>Deleted By</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((cat, i) => (
            <tr key={cat._id}>
              <td className="text-muted">{(currentPage - 1) * 15 + i + 1}</td>
              <td className="fw-semibold text-dark">{cat.name}</td>
              <td className="text-muted">{cat.description || '—'}</td>
              <td><span className="text-muted">{formatDate(cat.deletedAt)}</span></td>
              <td>{cat.deletedBy?.name || '—'}</td>
              <td className="text-end">
                <div className="d-flex justify-content-end gap-2 flex-wrap">
                  <button
                    className="btn btn-sm btn-outline-success d-flex align-items-center"
                    onClick={() => handleRestorePrompt(cat)}
                  >
                    <i className="bi bi-arrow-counterclockwise me-1"></i> Restore
                  </button>
                  <button
                    className="btn btn-sm btn-danger d-flex align-items-center"
                    onClick={() => handleHardDeletePrompt(cat)}
                  >
                    <i className="bi bi-trash3 me-1"></i> Delete Permanently
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMembersTable = () => (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0 small">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Email</th>
            <th>Student ID</th>
            <th>Library Card</th>
            <th>Deleted At</th>
            <th>Deleted By</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((member, i) => (
            <tr key={member._id}>
              <td className="text-muted">{(currentPage - 1) * 15 + i + 1}</td>
              <td className="fw-semibold text-dark">{member.name}</td>
              <td className="text-muted">{member.email}</td>
              <td><code className="small">{member.studentId || '—'}</code></td>
              <td>
                {member.libraryCardId ? (
                  <code className="small bg-warning-subtle px-1 rounded">{member.libraryCardId}</code>
                ) : '—'}
              </td>
              <td><span className="text-muted">{formatDate(member.deletedAt)}</span></td>
              <td>{member.deletedBy?.name || '—'}</td>
              <td className="text-end">
                <div className="d-flex justify-content-end gap-2 flex-wrap">
                  <button
                    className="btn btn-sm btn-outline-success d-flex align-items-center"
                    onClick={() => handleRestorePrompt(member)}
                  >
                    <i className="bi bi-arrow-counterclockwise me-1"></i> Restore
                  </button>
                  <button
                    className="btn btn-sm btn-danger d-flex align-items-center"
                    onClick={() => handleHardDeletePrompt(member)}
                  >
                    <i className="bi bi-trash3 me-1"></i> Delete Permanently
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1 d-flex align-items-center">
            <i className="bi bi-trash3 me-2 text-danger"></i> Trash
          </h3>
          <p className="text-muted small mb-0">
            Soft-deleted records. Restore to recover, or permanently delete to remove from database.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2">
            {summary.books + summary.categories + summary.members} item{(summary.books + summary.categories + summary.members) !== 1 ? 's' : ''} in trash
          </span>
        </div>
      </div>

      {/* Success / Error alerts */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center">
          <i className="bi bi-check-circle-fill me-2"></i>
          <div>{successMessage}</div>
          <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
        </div>
      )}
      {error && <ErrorMessage message={error} onRetry={fetchTrash} />}

      {/* Info banner */}
      <div className="alert alert-warning d-flex align-items-start py-3 mb-4">
        <i className="bi bi-info-circle-fill me-3 mt-1 fs-5 flex-shrink-0 text-warning"></i>
        <div className="small">
          <strong>Trash Policy:</strong> Soft-deleted records remain here and are excluded from normal views.
          Use <strong>Restore</strong> to recover a record. Use <strong>Delete Permanently</strong> only for records
          with no historical references — the backend will block permanent deletion if dependencies exist.
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-0 border-bottom-0" role="tablist">
        {TABS.map((tab) => (
          <li key={tab.key} className="nav-item">
            <button
              className={`nav-link d-flex align-items-center gap-2 ${activeTab === tab.key ? 'active fw-semibold' : 'text-muted'}`}
              onClick={() => handleTabChange(tab.key)}
              type="button"
            >
              <i className={`bi ${tab.icon}`}></i>
              {tab.label}
              {summary[tab.key] > 0 && (
                <span className="badge bg-danger rounded-pill" style={{ fontSize: '10px' }}>
                  {summary[tab.key]}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab Content */}
      <div className="card border shadow-sm rounded-top-0">
        <div className="card-body p-0">
          {loading ? (
            <Loading message="Loading trash records..." />
          ) : items.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-trash3 fs-1 d-block mb-2 text-secondary"></i>
              <div className="fw-semibold">No items in {activeTab} trash</div>
              <p className="small mb-0">Deleted {activeTab} will appear here.</p>
            </div>
          ) : (
            <>
              {activeTab === 'books' && renderBooksTable()}
              {activeTab === 'categories' && renderCategoriesTable()}
              {activeTab === 'members' && renderMembersTable()}

              {totalPages > 1 && (
                <div className="p-3 border-top">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={15}
                    onPageChange={(p) => setCurrentPage(p)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {restoreTarget && (
        <ConfirmModal
          isOpen={Boolean(restoreTarget)}
          title="Restore Record"
          message={`Restore "${getItemName(restoreTarget)}" back to the active list?`}
          confirmText="Restore"
          confirmVariant="success"
          isLoading={isRestoring}
          onConfirm={handleConfirmRestore}
          onCancel={() => setRestoreTarget(null)}
        />
      )}

      {/* Hard Delete Modal */}
      {hardDeleteTarget && (
        <HardDeleteModal
          isOpen={Boolean(hardDeleteTarget)}
          title="Permanently Delete Record?"
          description={getItemName(hardDeleteTarget)}
          warningText={hardDeleteError}
          isLoading={isHardDeleting}
          onConfirm={handleConfirmHardDelete}
          onCancel={() => { setHardDeleteTarget(null); setHardDeleteError(''); }}
        />
      )}
    </div>
  );
};

export default Trash;
