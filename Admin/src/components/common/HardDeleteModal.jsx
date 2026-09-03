import React, { useState, useEffect } from 'react';

/**
 * HardDeleteModal — requires Admin to type "DELETE" before confirming permanent deletion.
 * Used exclusively for permanent (irreversible) hard delete operations.
 *
 * Props:
 *   isOpen      — boolean
 *   title       — string
 *   description — string (what will be deleted)
 *   warningText — string (extra context, e.g. dependency info)
 *   isLoading   — boolean
 *   onConfirm   — function()
 *   onCancel    — function()
 */
const HardDeleteModal = ({
  isOpen,
  title = 'Permanently Delete Record?',
  description = '',
  warningText = '',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const [confirmInput, setConfirmInput] = useState('');

  // Reset input when modal opens/closes
  useEffect(() => {
    if (!isOpen) setConfirmInput('');
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmed = confirmInput.trim() === 'DELETE';

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content shadow-lg border-0">

            {/* Header */}
            <div className="modal-header bg-danger text-white border-0 rounded-top-3">
              <h5 className="modal-title d-flex align-items-center fw-bold">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {title}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onCancel}
                disabled={isLoading}
                aria-label="Close"
              ></button>
            </div>

            {/* Body */}
            <div className="modal-body py-4">
              {/* Warning block */}
              <div className="alert alert-danger d-flex align-items-start mb-3 py-3">
                <i className="bi bi-shield-exclamation fs-4 me-3 mt-1 flex-shrink-0"></i>
                <div>
                  <div className="fw-semibold mb-1">This action is permanent and irreversible.</div>
                  <div className="small text-danger-emphasis">
                    This record will be <strong>permanently removed</strong> from the database.
                    It cannot be recovered. Historical references may be affected.
                  </div>
                </div>
              </div>

              {/* What is being deleted */}
              {description && (
                <div className="bg-light border rounded-3 p-3 mb-3 small">
                  <span className="text-muted fw-semibold">Deleting:</span>
                  <div className="text-dark fw-semibold mt-1">{description}</div>
                </div>
              )}

              {/* Extra warning from backend dependency check */}
              {warningText && (
                <div className="alert alert-warning small py-2 mb-3">
                  <i className="bi bi-info-circle me-1"></i>
                  {warningText}
                </div>
              )}

              {/* Typed confirmation */}
              <div className="mb-1">
                <label className="form-label fw-semibold text-dark small mb-1">
                  Type <kbd className="bg-danger text-white px-2 py-1 rounded">DELETE</kbd> to confirm:
                </label>
                <input
                  type="text"
                  className={`form-control ${
                    confirmInput && !isConfirmed ? 'border-danger' : ''
                  } ${isConfirmed ? 'border-success' : ''}`}
                  placeholder="Type DELETE here"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  autoComplete="off"
                  disabled={isLoading}
                />
                {confirmInput && !isConfirmed && (
                  <div className="text-danger small mt-1">
                    <i className="bi bi-x-circle me-1"></i>
                    Type exactly: DELETE
                  </div>
                )}
                {isConfirmed && (
                  <div className="text-success small mt-1">
                    <i className="bi bi-check-circle me-1"></i>
                    Confirmation accepted
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger d-flex align-items-center"
                onClick={onConfirm}
                disabled={!isConfirmed || isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-trash3-fill me-2"></i>
                    Delete Permanently
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default HardDeleteModal;
