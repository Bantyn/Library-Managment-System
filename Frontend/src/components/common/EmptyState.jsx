import React from 'react';

const EmptyState = ({
  icon = 'bi-inbox',
  title = 'No records found',
  description = 'There is currently no information to display.',
  actionText,
  onAction,
}) => {
  return (
    <div className="card border-0 bg-light my-4 text-center py-5">
      <div className="card-body">
        <i className={`bi ${icon} fs-1 text-muted d-block mb-3`}></i>
        <h5 className="card-title text-dark">{title}</h5>
        <p className="card-text text-muted small mx-auto" style={{ maxWidth: '420px' }}>
          {description}
        </p>
        {actionText && onAction && (
          <button className="btn btn-sm btn-primary mt-2" onClick={onAction}>
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
