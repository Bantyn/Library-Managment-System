import React from 'react';

const ErrorMessage = ({ message, onRetry }) => {
  if (!message) return null;

  return (
    <div className="alert alert-danger d-flex align-items-center justify-content-between my-3 shadow-sm" role="alert">
      <div className="d-flex align-items-center">
        <i className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2 fs-5"></i>
        <div>{message}</div>
      </div>
      {onRetry && (
        <button
          type="button"
          className="btn btn-sm btn-outline-danger ms-3 text-nowrap"
          onClick={onRetry}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
