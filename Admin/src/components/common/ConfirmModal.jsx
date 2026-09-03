import React from 'react';

const ConfirmModal = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1055 }}
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content shadow">
            <div className="modal-header">
              <h5 className="modal-title d-flex align-items-center">
                <i
                  className={`bi ${
                    confirmVariant === 'danger'
                      ? 'bi-exclamation-octagon text-danger'
                      : 'bi-question-circle text-primary'
                  } me-2`}
                ></i>
                {title}
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onCancel}
                disabled={isLoading}
              ></button>
            </div>
            <div className="modal-body py-4">
              <p className="mb-0 text-secondary">{message}</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onCancel}
                disabled={isLoading}
              >
                {cancelText}
              </button>
              <button
                type="button"
                className={`btn btn-${confirmVariant} d-flex align-items-center`}
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading && (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                )}
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmModal;
