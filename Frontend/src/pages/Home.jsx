import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookService } from '../services/bookService';
import { categoryService } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/books/BookCard';
import MasterSearchBar from '../components/common/MasterSearchBar';
import Loading from '../components/common/Loading';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [booksRes, catsRes, statsRes] = await Promise.allSettled([
          bookService.getBooks({ limit: 4 }),
          categoryService.getCategories(),
          bookService.getPublicStats(),
        ]);

        if (booksRes.status === 'fulfilled' && booksRes.value?.success) {
          setFeaturedBooks(booksRes.value.data || []);
        }
        if (catsRes.status === 'fulfilled' && catsRes.value?.success) {
          setCategories(catsRes.value.data || []);
        }
        if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
          setStats(statsRes.value.data || null);
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  // Helper to assign relevant icons to academic disciplines
  const getCategoryIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('computer') || n.includes('ai') || n.includes('tech')) return 'bi-cpu';
    if (n.includes('business') || n.includes('management')) return 'bi-briefcase';
    if (n.includes('finance') || n.includes('economic')) return 'bi-cash-coin';
    if (n.includes('math') || n.includes('statistic')) return 'bi-calculator';
    if (n.includes('physic') || n.includes('science')) return 'bi-atom';
    if (n.includes('psycholog') || n.includes('cognitive')) return 'bi-heart-pulse';
    if (n.includes('literature') || n.includes('classic')) return 'bi-journal-bookmark';
    if (n.includes('fiction') || n.includes('thriller')) return 'bi-compass';
    if (n.includes('history') || n.includes('civiliz')) return 'bi-bank';
    if (n.includes('philosophy') || n.includes('ethic')) return 'bi-lightbulb';
    if (n.includes('self') || n.includes('productiv')) return 'bi-stars';
    if (n.includes('exam') || n.includes('aptitude')) return 'bi-mortarboard';
    if (n.includes('medicine') || n.includes('health')) return 'bi-hospital';
    if (n.includes('biography') || n.includes('memoir')) return 'bi-person-badge';
    return 'bi-bookmark';
  };

  return (
    <div className="bg-light">
      {/* ===================================================================
          1. HERO SECTION
          =================================================================== */}
      <section className="bg-white border-bottom py-5">
        <div className="container py-lg-4">
          <div className="row align-items-center g-5">
            {/* Left Column: Core Message & Actions */}
            <div className="col-12 col-lg-7 text-center text-lg-start">
              <span className="badge bg-primary-subtle text-dark border border-warning px-3 py-2 mb-3 fw-medium">
                <i className="bi bi-mortarboard-fill me-1 text-dark"></i> Academic Knowledge Portal
              </span>
              <h1 className="display-4 fw-bold text-dark mb-3" style={{ letterSpacing: '-0.5px' }}>
                PustakSetu
                <span className="d-block fs-3 fw-normal text-secondary mt-1">
                  Smart Library Management System
                </span>
              </h1>
              <p className="lead text-secondary mb-4" style={{ maxWidth: '580px', lineHeight: '1.6' }}>
                Discover books, manage your library activities, track borrowed books, and access
                everything you need from one place.
              </p>

              {/* Master Search Bar with live autocomplete & keyword bolding */}
              <div className="mb-4" style={{ maxWidth: '580px' }}>
                <MasterSearchBar
                  size="lg"
                  placeholder="Search books by title, author, or ISBN (e.g. Clean Code, Martin, 978)..."
                />
              </div>

              <div className="d-flex flex-wrap justify-content-center justify-content-lg-start gap-3">
                <Link
                  to="/books"
                  className="btn btn-primary btn-lg text-dark fw-semibold px-4 d-inline-flex align-items-center shadow-sm"
                >
                  <i className="bi bi-search me-2"></i> Browse Books
                </Link>
                {isAuthenticated ? (
                  <Link
                    to="/my-books"
                    className="btn btn-outline-dark btn-lg px-4 d-inline-flex align-items-center"
                  >
                    <i className="bi bi-journal-bookmark me-2"></i> My Borrowed Books
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="btn btn-outline-dark btn-lg px-4 d-inline-flex align-items-center"
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i> Login / Get Started
                  </Link>
                )}
              </div>
            </div>

            {/* Right Column: Visual Library Showcase Card */}
            <div className="col-12 col-lg-5">
              <div className="p-4 p-md-4 bg-light rounded-4 border shadow-sm text-start">
                <div className="d-flex align-items-center mb-3">
                  <div
                    className="bg-primary rounded-3 d-flex align-items-center justify-content-center me-3 border border-warning shadow-sm"
                    style={{ width: '48px', height: '48px' }}
                  >
                    <img
                      src="/library-logo.png"
                      alt="PustakSetu Emblem"
                      width="32"
                      height="32"
                    />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">PustakSetu Central Library</h6>
                    <span className="text-muted small">Campus Circulation Desk • 2026</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-3 border mb-3 small">
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-secondary">Standard Loan Period</span>
                    <strong className="text-dark">14 Calendar Days</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-secondary">Overdue Rate</span>
                    <strong className="text-dark">₹5.00 / day</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-secondary">Library Card Format</span>
                    <strong className="text-dark">12 Decimal Digits</strong>
                  </div>
                </div>

                {isAuthenticated ? (
                  <div className="small text-secondary d-flex align-items-center bg-white p-2 rounded border">
                    <i className="bi bi-check-circle-fill text-success fs-5 me-2"></i>
                    <div>
                      Signed in as <strong>{user?.name || 'Student Member'}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="small text-muted d-flex align-items-center bg-white p-2 rounded border">
                    <i className="bi bi-info-circle text-primary fs-5 me-2"></i>
                    <div>
                      New student?{' '}
                      <Link to="/register" className="fw-semibold text-dark text-decoration-underline">
                        Register with your Student ID
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          2. LIBRARY STATISTICS SECTION
          =================================================================== */}
      <section className="py-4 bg-white border-bottom">
        <div className="container">
          <div className="row g-3 text-center">
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded-3 border h-100">
                <div className="d-inline-flex align-items-center justify-content-center p-2 rounded-circle bg-white border mb-2 text-dark">
                  <i className="bi bi-book fs-5"></i>
                </div>
                <h3 className="fw-bold text-dark mb-0">
                  {stats ? stats.totalBooks : '44'}
                </h3>
                <span className="text-secondary small">Total Books</span>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded-3 border h-100">
                <div className="d-inline-flex align-items-center justify-content-center p-2 rounded-circle bg-white border mb-2 text-dark">
                  <i className="bi bi-box-seam fs-5"></i>
                </div>
                <h3 className="fw-bold text-dark mb-0">
                  {stats ? stats.availableCopies : '200+'}
                </h3>
                <span className="text-secondary small">Available Copies</span>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded-3 border h-100">
                <div className="d-inline-flex align-items-center justify-content-center p-2 rounded-circle bg-white border mb-2 text-dark">
                  <i className="bi bi-tags fs-5"></i>
                </div>
                <h3 className="fw-bold text-dark mb-0">
                  {stats ? stats.totalCategories : '14'}
                </h3>
                <span className="text-secondary small">Academic Categories</span>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded-3 border h-100">
                <div className="d-inline-flex align-items-center justify-content-center p-2 rounded-circle bg-white border mb-2 text-dark">
                  <i className="bi bi-journal-arrow-up fs-5"></i>
                </div>
                <h3 className="fw-bold text-dark mb-0">
                  {stats ? stats.activeLoans : '0'}
                </h3>
                <span className="text-secondary small">Books Issued</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          3. FEATURED BOOKS SECTION
          =================================================================== */}
      <section className="py-5">
        <div className="container">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">
            <div>
              <h3 className="fw-bold text-dark mb-1">Featured Books</h3>
              <p className="text-muted small mb-0">
                Curated selections from our academic catalog ready for campus checkout
              </p>
            </div>
            <Link
              to="/books"
              className="btn btn-outline-dark btn-sm d-inline-flex align-items-center align-self-start align-self-md-center"
            >
              View Full Catalog <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>

          {loading ? (
            <Loading message="Loading featured books..." />
          ) : featuredBooks.length > 0 ? (
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
              {featuredBooks.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>
          ) : (
            <div className="text-center py-5 bg-white rounded-3 border text-muted">
              <i className="bi bi-journal-x fs-1 d-block mb-2"></i>
              No books available in the catalog currently.
            </div>
          )}
        </div>
      </section>

      {/* ===================================================================
          4. BROWSE BY CATEGORY SECTION
          =================================================================== */}
      <section className="py-5 bg-white border-top border-bottom">
        <div className="container">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">
            <div>
              <h3 className="fw-bold text-dark mb-1">Explore by Category</h3>
              <p className="text-muted small mb-0">
                Discover textbooks, research, and literature across diverse academic disciplines
              </p>
            </div>
            <Link
              to="/books"
              className="btn btn-outline-dark btn-sm d-inline-flex align-items-center align-self-start align-self-md-center"
            >
              All Categories ({categories.length}) <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>

          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
            {categories.slice(0, 8).map((cat) => (
              <div key={cat._id} className="col">
                <Link
                  to={`/books?category=${cat._id}`}
                  className="card h-100 border text-decoration-none shadow-sm p-3 bg-light hover-shadow text-dark transition"
                >
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle bg-white border d-flex align-items-center justify-content-center me-3 text-dark flex-shrink-0"
                      style={{ width: '42px', height: '42px' }}
                    >
                      <i className={`bi ${getCategoryIcon(cat.name)} fs-5`}></i>
                    </div>
                    <div className="overflow-hidden">
                      <h6 className="fw-bold mb-0 text-truncate">{cat.name}</h6>
                      <small className="text-muted d-block text-truncate">
                        {cat.description || 'Browse collection'}
                      </small>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================
          5. WHY PUSTAKSETU (EVERYTHING YOU NEED TO MANAGE YOUR LIBRARY)
          =================================================================== */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5" style={{ maxWidth: '640px', margin: '0 auto' }}>
            <span className="badge bg-primary-subtle text-dark border border-warning px-3 py-1 mb-2 fw-medium">
              Platform Features
            </span>
            <h3 className="fw-bold text-dark mb-2">Everything You Need to Manage Your Library</h3>
            <p className="text-muted small">
              Designed specifically for campus students, researchers, and administrators
            </p>
          </div>

          <div className="row g-4">
            <div className="col-12 col-md-6 col-lg-3">
              <div className="card h-100 border p-4 bg-white shadow-sm">
                <div
                  className="rounded-3 bg-primary border border-warning d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '44px', height: '44px' }}
                >
                  <i className="bi bi-search text-dark fs-5"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Easy Book Discovery</h5>
                <p className="text-secondary small mb-0">
                  Search and explore available books quickly with title, author, ISBN, and rack shelf
                  location details.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <div className="card h-100 border p-4 bg-white shadow-sm">
                <div
                  className="rounded-3 bg-primary border border-warning d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '44px', height: '44px' }}
                >
                  <i className="bi bi-clock-history text-dark fs-5"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Simple Borrowing Management</h5>
                <p className="text-secondary small mb-0">
                  Track issued books, 14-day due dates, returns, and transparent penalty calculations
                  seamlessly.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <div className="card h-100 border p-4 bg-white shadow-sm">
                <div
                  className="rounded-3 bg-primary border border-warning d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '44px', height: '44px' }}
                >
                  <i className="bi bi-person-badge text-dark fs-5"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Personal Library Profile</h5>
                <p className="text-secondary small mb-0">
                  Students can view their profile, centralized Library Card ID, borrowing history,
                  and account status.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <div className="card h-100 border p-4 bg-white shadow-sm">
                <div
                  className="rounded-3 bg-primary border border-warning d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '44px', height: '44px' }}
                >
                  <i className="bi bi-shield-check text-dark fs-5"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Smart Library Management</h5>
                <p className="text-secondary small mb-0">
                  Administrators manage books, members, physical inventory movements, audit logs,
                  and institutional reports.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          6. LIBRARY CARD HIGHLIGHT SECTION
          =================================================================== */}
      <section className="py-5 bg-white border-top border-bottom">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-12 col-lg-7">
              <span className="badge bg-primary-subtle text-dark border border-warning px-3 py-1 mb-2 fw-medium">
                Centralized Identification
              </span>
              <h3 className="fw-bold text-dark mb-3">
                Your Library. Your Card. Your Identity.
              </h3>
              <p className="text-secondary mb-3" style={{ lineHeight: '1.6' }}>
                Every registered member receives one unique, centralized <strong>12-digit numeric Library Card ID</strong>.
                This decimal identifier serves as your primary campus credential for instant physical book checkout,
                due date verification, and self-service account management.
              </p>
              <ul className="list-unstyled small text-secondary mb-4">
                <li className="mb-2 d-flex align-items-center">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  <span>100% Unique & Decimal-digits Only (0-9)</span>
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  <span>Immutable after registration for complete academic auditing</span>
                </li>
                <li className="d-flex align-items-center">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  <span>Unified identification across physical counters and student portal</span>
                </li>
              </ul>
              {isAuthenticated ? (
                <Link to="/profile" className="btn btn-outline-dark btn-sm px-3">
                  <i className="bi bi-credit-card-2-front me-1"></i> View My Library Card
                </Link>
              ) : (
                <Link to="/register" className="btn btn-outline-dark btn-sm px-3">
                  <i className="bi bi-person-plus me-1"></i> Get Your Library Card
                </Link>
              )}
            </div>

            <div className="col-12 col-lg-5 text-center">
              {/* Promotional Library Card Mockup Preview */}
              <div
                className="p-4 rounded-4 border bg-light text-start shadow-sm mx-auto position-relative"
                style={{ maxWidth: '380px' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center">
                    <img
                      src="/library-logo.png"
                      alt="PustakSetu"
                      width="26"
                      height="26"
                      className="me-2"
                    />
                    <span className="fw-bold text-dark small">PustakSetu Library Pass</span>
                  </div>
                  <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '10px' }}>
                    Active
                  </span>
                </div>

                <div className="bg-white p-3 rounded-3 border mb-3">
                  <div className="text-muted small" style={{ fontSize: '10px' }}>
                    PASS IDENTIFICATION NUMBER
                  </div>
                  <div className="fw-mono fs-5 fw-bold text-dark tracking-wide font-monospace mt-1">
                    0000 • 0000 • 0001
                  </div>
                  <div className="d-flex justify-content-between mt-3 text-muted" style={{ fontSize: '11px' }}>
                    <span>CARD TYPE: STUDENT</span>
                    <span>VALID: 2026</span>
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-between text-muted small" style={{ fontSize: '11px' }}>
                  <span>Campus Digital Access</span>
                  <i className="bi bi-qr-code fs-5 text-secondary"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          7. CALL TO ACTION (CTA)
          =================================================================== */}
      <section className="py-5 bg-light">
        <div className="container text-center py-lg-4" style={{ maxWidth: '640px' }}>
          <h3 className="fw-bold text-dark mb-2">Ready to explore the library?</h3>
          <p className="text-secondary mb-4">
            Find your next book and keep track of your library activity with PustakSetu.
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            <Link
              to="/books"
              className="btn btn-primary btn-lg text-dark fw-semibold px-4 shadow-sm"
            >
              <i className="bi bi-search me-2"></i> Browse Books
            </Link>
            {isAuthenticated ? (
              <Link to="/my-books" className="btn btn-outline-dark btn-lg px-4">
                <i className="bi bi-journal-bookmark me-2"></i> My Books
              </Link>
            ) : (
              <Link to="/register" className="btn btn-outline-dark btn-lg px-4">
                <i className="bi bi-person-plus me-2"></i> Create Account
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
