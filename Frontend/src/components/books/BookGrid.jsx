import React from 'react';
import BookCard from './BookCard';

const BookGrid = ({ books = [] }) => {
  return (
    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
      {books.map((book) => (
        <BookCard key={book._id} book={book} />
      ))}
    </div>
  );
};

export default BookGrid;
