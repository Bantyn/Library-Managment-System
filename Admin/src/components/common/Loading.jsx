import React from 'react';

const Loading = ({ message = 'Loading...', size = '' }) => {
  const spinnerClass = size === 'sm' ? 'spinner-border spinner-border-sm text-primary' : 'spinner-border text-primary';

  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-4 my-3 text-center">
      <div className={spinnerClass} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && <p className="mt-2 mb-0 text-muted small">{message}</p>}
    </div>
  );
};

export default Loading;
