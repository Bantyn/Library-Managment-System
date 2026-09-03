import React from 'react';

const BookSearch = ({ searchTerm, onSearchChange, onSearchSubmit, onClearSearch }) => {
  return (
    <form onSubmit={onSearchSubmit} className="w-100">
      <div className="input-group">
        <span className="input-group-text bg-white border-end-0">
          <i className="bi bi-search text-muted"></i>
        </span>
        <input
          type="text"
          className="form-control border-start-0"
          placeholder="Search books by title, author, or ISBN..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <button
            className="btn btn-outline-secondary border-start-0"
            type="button"
            onClick={onClearSearch}
            aria-label="Clear search"
          >
            <i className="bi bi-x"></i>
          </button>
        )}
        <button className="btn btn-primary" type="submit">
          Search
        </button>
      </div>
    </form>
  );
};

export default BookSearch;
