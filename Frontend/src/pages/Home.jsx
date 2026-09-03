import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookService } from '../services/bookService';
import { categoryService } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import BookGrid from '../components/books/BookGrid';
import Loading from '../components/common/Loading';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [booksRes, catsRes] = await Promise.all([
          bookService.getBooks({ limit: 4 }),
          categoryService.getCategories(),
        ]);

        if (booksRes.success) setFeaturedBooks(booksRes.data || []);
        if (catsRes.success) setCategories(catsRes.data || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-white border-bottom py-5">
        <div className="container py-lg-4">
          <div className="row align-items-center g-5">
            <div className="col-12 col-lg-7">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 mb-3 fw-medium">
                <i className="bi bi-mortarboard me-1"></i> Campus Digital Library
              </span>
              <h1 className="display-5 fw-bold text-dark mb-3">
                Your Library, <br />
                <span className="text-primary">Your Knowledge.</span>
              </h1>
              <p className="lead text-secondary mb-4">
                Discover academic references, explore course textbooks, check real-time stock
                availability, and track your active borrowings and return dates.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/books" className="btn btn-primary btn-lg px-4 d-flex align-items-center">
                  <i className="bi bi-search me-2"></i> Browse Books Catalog
                </Link>
                {isAuthenticated ? (
                  <Link to="/my-books" className="btn btn-outline-secondary btn-lg px-4">
                    My Borrowed Books
                  </Link>
                ) : (
                  <Link to="/login" className="btn btn-outline-secondary btn-lg px-4">
                    Student Sign In
                  </Link>
                )}
              </div>
            </div>

            <div className="col-12 col-lg-5 text-center">
              <div className="p-4 p-md-5 bg-light rounded-4 border shadow-sm text-start">
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-primary text-white p-3 rounded-3 me-3">
                    <i className="bi bi-journal-check fs-3"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0 text-dark">Quick Library Access</h5>
                    <span className="text-muted small">Academic Year 2026</span>
                  </div>
                </div>

                <div className="py-2 border-top border-bottom my-3 small text-secondary">
                  <div className="d-flex justify-content-between py-1">
                    <span>Standard Loan Period</span>
                    <strong className="text-dark">14 Calendar Days</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span>Overdue Fine Rate</span>
                    <strong className="text-dark">₹5.00 / day</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span>Catalog Status</span>
                    <strong className="text-success">Live & Synchronized</strong>
                  </div>
                </div>

                {isAuthenticated ? (
                  <div className="small text-muted">
                    Welcome back, <strong>{user?.name}</strong>! Check your active loans and due dates.
                  </div>
                ) : (
                  <div className="small text-muted">
                    New student? <Link to="/register" className="fw-medium text-primary text-decoration-none">Register your library account</Link> using your Student ID.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      {categories.length > 0 && (
        <section className="py-4 bg-light border-bottom">
          <div className="container">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="text-muted small fw-semibold me-2">Explore Subjects:</span>
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat._id}
                  to={`/books?category=${cat._id}`}
                  className="btn btn-sm btn-white bg-white border text-secondary text-decoration-none shadow-sm"
                >
                  <i className="bi bi-tag me-1 text-primary"></i>
                  {cat.name}
                </Link>
              ))}
              <Link to="/books" className="btn btn-sm btn-link text-primary text-decoration-none ms-auto">
                All Categories →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Books Section */}
      <section className="py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="fw-bold text-dark mb-1">Featured Available Titles</h4>
              <p className="text-muted small mb-0">Recently added books ready for campus checkout</p>
            </div>
            <Link to="/books" className="btn btn-outline-primary btn-sm">
              View All Catalog ({featuredBooks.length}+)
            </Link>
          </div>

          {loading ? (
            <Loading message="Loading catalog selections..." />
          ) : featuredBooks.length > 0 ? (
            <BookGrid books={featuredBooks} />
          ) : (
            <div className="text-center py-4 text-muted">No books available currently.</div>
          )}
        </div>
      </section>

      {/* How It Works Banner */}
      <section className="py-5 bg-white border-top">
        <div className="container">
          <div className="text-center mb-5">
            <h4 className="fw-bold text-dark mb-1">How Campus Circulation Works</h4>
            <p className="text-muted small">Simple three-step workflow for all enrolled students</p>
          </div>

          <div className="row g-4 text-center">
            <div className="col-12 col-md-4">
              <div className="p-4 rounded-3 h-100 bg-light border">
                <div
                  className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 fs-4"
                  style={{ width: '48px', height: '48px' }}
                >
                  1
                </div>
                <h5 className="fw-bold text-dark mb-2">Search Catalog</h5>
                <p className="text-muted small mb-0">
                  Search by title, author, or ISBN to verify availability and rack shelf location.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="p-4 rounded-3 h-100 bg-light border">
                <div
                  className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 fs-4"
                  style={{ width: '48px', height: '48px' }}
                >
                  2
                </div>
                <h5 className="fw-bold text-dark mb-2">Visit Circulation Desk</h5>
                <p className="text-muted small mb-0">
                  Present your Student ID to the library administrator to issue your book for 14 days.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="p-4 rounded-3 h-100 bg-light border">
                <div
                  className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 fs-4"
                  style={{ width: '48px', height: '48px' }}
                >
                  3
                </div>
                <h5 className="fw-bold text-dark mb-2">Track & Return</h5>
                <p className="text-muted small mb-0">
                  Monitor due dates in your online account to avoid overdue penalties and fines.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
