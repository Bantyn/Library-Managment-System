import React from 'react';

const BookSearch = ({ searchTerm, onSearchChange, onSearchSubmit, onClearSearch }) => {
  return (
    <form onSubmit={onSearchSubmit} className="w-100 m-0">
      <div className="input-group shadow-sm rounded-3 overflow-hidden bg-white border border-secondary-subtle">
        <span className="input-group-text bg-white border-0 ps-3 pe-2 text-secondary">
          <i className="bi bi-search"></i>
        </span>

        <input
          type="text"
          className="form-control border-0 shadow-none py-2 search-input-no-focus"
          style={{
            outline: 'none',
            boxShadow: 'none',
            border: 'none',
          }}
          placeholder="Search books by title, author, category, or ISBN..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          autoComplete="off"
          aria-label="Search catalog books"
        />

        {searchTerm && (
          <button
            className="btn btn-white bg-white border-0 text-muted px-2"
            type="button"
            onClick={onClearSearch}
            aria-label="Clear search"
            title="Clear search"
          >
            <i className="bi bi-x-circle-fill"></i>
          </button>
        )}

        <button
          className="btn btn-primary text-dark fw-semibold px-4 border-0 d-flex align-items-center"
          type="submit"
        >
          <span>Search</span>
          <i className="bi bi-search ms-2 d-none d-sm-inline"></i>
        </button>
      </div>
    </form>
  );
};

export default BookSearch;
