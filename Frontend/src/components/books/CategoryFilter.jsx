import React from 'react';

const CategoryFilter = ({ categories = [], selectedCategory, onCategoryChange }) => {
  return (
    <select
      className="form-select"
      value={selectedCategory}
      onChange={(e) => onCategoryChange(e.target.value)}
      aria-label="Filter by category"
    >
      <option value="">All Subject Categories</option>
      {categories.map((cat) => (
        <option key={cat._id} value={cat._id}>
          {cat.name}
        </option>
      ))}
    </select>
  );
};

export default CategoryFilter;
