import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/categoryService';
import { formatDate } from '../utils/formatDate';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import ConfirmModal from '../components/common/ConfirmModal';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Add / Edit Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal state
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await categoryService.getCategories();
      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load categories. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Category name is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');
    try {
      if (editingCategory) {
        // Update
        const res = await categoryService.updateCategory(editingCategory._id, formData);
        if (res.success) {
          setSuccessMessage(`Category "${formData.name}" updated successfully.`);
          setShowModal(false);
          fetchCategories();
        }
      } else {
        // Create
        const res = await categoryService.createCategory(formData);
        if (res.success) {
          setSuccessMessage(`Category "${formData.name}" created successfully.`);
          setShowModal(false);
          fetchCategories();
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Operation failed. Check for duplicate names.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    setError('');
    try {
      const res = await categoryService.deleteCategory(categoryToDelete._id);
      if (res.success) {
        setSuccessMessage(`Category "${categoryToDelete.name}" moved to Trash. You can restore it from the Trash page.`);
        setCategoryToDelete(null);
        fetchCategories();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Cannot move category to trash. Ensure no active books are assigned to it.'
      );
      setCategoryToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1">Categories</h3>
          <p className="text-muted small mb-0">
            Organize catalog titles into subjects and academic domains
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary d-flex align-items-center"
          onClick={handleOpenAddModal}
        >
          <i className="bi bi-plus-lg me-1"></i> Add Category
        </button>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          <div>{successMessage}</div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMessage('')}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Error Alert */}
      {error && <ErrorMessage message={error} onRetry={fetchCategories} />}

      {/* Categories Card & Table */}
      <div className="card border shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <Loading message="Loading category records..." />
          ) : categories.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 bg-white">
                <thead className="table-light">
                  <tr>
                    <th scope="col" style={{ width: '5%' }}>#</th>
                    <th scope="col" style={{ width: '25%' }}>Category Name</th>
                    <th scope="col" style={{ width: '45%' }}>Description</th>
                    <th scope="col" style={{ width: '15%' }}>Created Date</th>
                    <th scope="col" className="text-end" style={{ width: '10%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, idx) => (
                    <tr key={cat._id}>
                      <td className="text-muted small">{idx + 1}</td>
                      <td>
                        <span className="fw-semibold text-dark">{cat.name}</span>
                      </td>
                      <td className="text-secondary small">
                        {cat.description || <span className="text-muted fst-italic">No description</span>}
                      </td>
                      <td className="text-muted small">{formatDate(cat.createdAt)}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="Edit Category"
                            onClick={() => handleOpenEditModal(cat)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="Delete Category"
                            onClick={() => setCategoryToDelete(cat)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon="bi-tags"
              title="No categories found"
              description="Categories help structure your books. Create your first category to get started."
              actionText="Add First Category"
              onAction={handleOpenAddModal}
            />
          )}
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content shadow">
              <form onSubmit={handleSaveCategory}>
                <div className="modal-header">
                  <h5 className="modal-title fw-semibold">
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="catName" className="form-label fw-medium">
                      Category Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                      id="catName"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="e.g. Computer Science"
                      disabled={isSubmitting}
                      autoFocus
                    />
                    {formErrors.name && (
                      <div className="invalid-feedback">{formErrors.name}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="catDesc" className="form-label fw-medium">
                      Description
                    </label>
                    <textarea
                      className="form-control"
                      id="catDesc"
                      rows="3"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Optional details regarding this category..."
                      disabled={isSubmitting}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary d-flex align-items-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && (
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                    )}
                    {isSubmitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Move to Trash Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(categoryToDelete)}
        title="Move Category to Trash"
        message={`Move "${categoryToDelete?.name}" to trash? It will be hidden from active lists but can be restored from the Trash page.`}
        confirmText="Move to Trash"
        confirmVariant="warning"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
};

export default Categories;
