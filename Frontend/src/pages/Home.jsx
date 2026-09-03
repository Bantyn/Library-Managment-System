import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { bookService } from '../services/bookService';
import { categoryService } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/books/BookCard';
import MasterSearchBar from '../components/common/MasterSearchBar';
import Loading from '../components/common/Loading';
import './home-animations.css';

/* ==========================================================================
   Custom Hook: useScrollReveal
   Attaches IntersectionObserver to any ref, adds 'is-visible' on enter.
   Triggers only once by default.
   ========================================================================== */
const useScrollReveal = (options = {}) => {
  const ref = useRef(null);
  const { threshold = 0.15, once = true } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          if (once) observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  return ref;
};

/* ==========================================================================
   Custom Hook: useCountUp
   Animates a number from 0 to target over `duration` ms.
   Starts when `start` becomes true.
   ========================================================================== */
const useCountUp = (target, duration = 1200, start = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start || target === null || target === undefined) return;

    const numTarget = parseInt(target, 10);
    if (isNaN(numTarget) || numTarget === 0) {
      setCount(0);
      return;
    }

    let startTime = null;
    let frame;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * numTarget));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, start]);

  return count;
};

/* ==========================================================================
   StatCard — animated stat box with count-up
   ========================================================================== */
const StatCard = ({ icon, value, label, delay = 0, startCount }) => {
  const displayCount = useCountUp(value, 1100, startCount);

  return (
    <div className="col-6 col-md-3 ps-stagger-item">
      <div
        className="p-3 p-md-4 bg-light rounded-3 border h-100 text-center"
        style={{ transition: `transform 0.2s ease, box-shadow 0.2s ease` }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(141,91,0,0.09)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '';
        }}
      >
        <div className="d-inline-flex align-items-center justify-content-center p-2 rounded-circle bg-white border mb-2 text-dark">
          <i className={`bi ${icon} fs-5`}></i>
        </div>
        <div className="ps-stat-number">
          <h3 className="fw-bold text-dark mb-0">
            {startCount && value !== null ? displayCount : (value ?? '–')}
          </h3>
        </div>
        <span className="text-secondary small">{label}</span>
      </div>
    </div>
  );
};

/* ==========================================================================
   Home Page Component
   ========================================================================== */
const Home = () => {
  const { isAuthenticated, user } = useAuth();

  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Stats count-up trigger
  const [startCount, setStartCount] = useState(false);
  const statsRef = useScrollReveal({ threshold: 0.2 });

  // Trigger count-up when stats section enters viewport
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStartCount(true); obs.unobserve(el); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [statsRef]);

  // Scroll reveal refs for each section
  const booksRef      = useScrollReveal({ threshold: 0.1 });
  const catsRef       = useScrollReveal({ threshold: 0.1 });
  const catsGridRef   = useScrollReveal({ threshold: 0.1 });
  const featuresRef   = useScrollReveal({ threshold: 0.12 });
  const cardSectionRef = useScrollReveal({ threshold: 0.15 });
  const ctaRef        = useScrollReveal({ threshold: 0.2 });

  // Feature reveal refs (directional)
  const feat1Ref = useScrollReveal({ threshold: 0.2 });
  const feat2Ref = useScrollReveal({ threshold: 0.2 });
  const feat3Ref = useScrollReveal({ threshold: 0.2 });
  const feat4Ref = useScrollReveal({ threshold: 0.2 });

  // CTA stagger
  const ctaHeadRef  = useScrollReveal({ threshold: 0.25 });
  const ctaDescRef  = useScrollReveal({ threshold: 0.25 });
  const ctaBtnsRef  = useScrollReveal({ threshold: 0.25 });

  // Data loading
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

  // Category icon mapping
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
          1. HERO SECTION — animated on mount
          =================================================================== */}
      <section className="bg-white border-bottom py-5 ps-hero-section">
        {/* Decorative floating blobs — isolated in their own overflow:hidden layer */}
        <div className="ps-hero-deco-layer">
          <div className="ps-deco-bubble ps-deco-1"></div>
          <div className="ps-deco-bubble ps-deco-2"></div>
          <div className="ps-deco-bubble ps-deco-3"></div>
        </div>

        <div className="container py-lg-4" style={{ position: 'relative', zIndex: 1 }}>
          <div className="row align-items-center g-5">

            {/* Left Column */}
            <div className="col-12 col-lg-7 text-center text-lg-start">
              <div className="ps-hero-badge">
                <span className="badge bg-primary-subtle text-dark border border-warning px-3 py-2 mb-3 fw-medium">
                  <i className="bi bi-mortarboard-fill me-1 text-dark"></i> Academic Knowledge Portal
                </span>
              </div>

              <div className="ps-hero-heading">
                <h1 className="display-4 fw-bold text-dark mb-3" style={{ letterSpacing: '-0.5px' }}>
                  PustakSetu
                  <span className="d-block fs-3 fw-normal text-secondary mt-1">
                    Smart Library Management System
                  </span>
                </h1>
              </div>

              <div className="ps-hero-desc">
                <p className="lead text-secondary mb-4" style={{ maxWidth: '580px', lineHeight: '1.6' }}>
                  Discover books, manage your library activities, track borrowed books, and access
                  everything you need from one place.
                </p>
              </div>

              {/* Master Search Bar — high z-index so dropdown always floats above sibling buttons */}
              <div
                className="ps-hero-search mb-4 mx-auto mx-lg-0"
                style={{ maxWidth: '580px', position: 'relative', zIndex: 100 }}
              >
                <MasterSearchBar
                  size="lg"
                  placeholder="Search books by title, author, or ISBN..."
                />
              </div>

              <div
                className="ps-hero-cta d-flex flex-wrap justify-content-center justify-content-lg-start gap-3"
                style={{ position: 'relative', zIndex: 1 }}
              >
                <Link
                  to="/books"
                  className="btn btn-primary btn-lg text-dark fw-semibold px-4 d-inline-flex align-items-center shadow-sm ps-cta-btn-primary"
                >
                  <i className="bi bi-search me-2"></i> Browse Books
                </Link>
                {isAuthenticated ? (
                  <Link
                    to="/my-books"
                    className="btn btn-outline-dark btn-lg px-4 d-inline-flex align-items-center ps-cta-btn-outline"
                  >
                    <i className="bi bi-journal-bookmark me-2"></i> My Borrowed Books
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="btn btn-outline-dark btn-lg px-4 d-inline-flex align-items-center ps-cta-btn-outline"
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i> Login / Get Started
                  </Link>
                )}
              </div>
            </div>

            {/* Right Column: Library Info Card — slides in from right */}
            <div className="col-12 col-lg-5 ps-hero-card">
              <div className="p-4 bg-light rounded-4 border shadow-sm text-start ps-float-1">
                <div className="d-flex align-items-center mb-3">
                  <div
                    className="bg-primary rounded-3 d-flex align-items-center justify-content-center me-3 border border-warning shadow-sm"
                    style={{ width: '48px', height: '48px', flexShrink: 0 }}
                  >
                    <img src="/library-logo.png" alt="PustakSetu Emblem" width="32" height="32" />
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
                    <div>Signed in as <strong>{user?.name || 'Student Member'}</strong></div>
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
          2. STATISTICS — count-up + staggered reveal
          =================================================================== */}
      <section className="py-4 bg-white border-bottom">
        <div className="container">
          <div
            ref={statsRef}
            className="row g-3 text-center ps-stagger-group"
          >
            <StatCard icon="bi-book"             value={stats?.totalBooks}        label="Total Books"          startCount={startCount} />
            <StatCard icon="bi-box-seam"         value={stats?.availableCopies}   label="Available Copies"     startCount={startCount} />
            <StatCard icon="bi-tags"             value={stats?.totalCategories}   label="Academic Categories"  startCount={startCount} />
            <StatCard icon="bi-journal-arrow-up" value={stats?.activeLoans}       label="Books Issued"         startCount={startCount} />
          </div>
        </div>
      </section>

      {/* ===================================================================
          3. FEATURED BOOKS — staggered card reveal
          =================================================================== */}
      <section className="py-5">
        <div className="container">
          <div
            ref={booksRef}
            className="ps-reveal mb-4"
          >
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
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
          </div>

          {loading ? (
            <Loading message="Loading featured books..." />
          ) : featuredBooks.length > 0 ? (
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4 ps-stagger-group is-visible">
              {featuredBooks.map((book, i) => (
                <div
                  key={book._id}
                  className="ps-stagger-item ps-book-card"
                  style={{ '--stagger-delay': `${i * 0.08}s` }}
                >
                  <BookCard book={book} />
                </div>
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
          4. EXPLORE BY CATEGORY — staggered grid
          =================================================================== */}
      <section className="py-5 bg-white border-top border-bottom">
        <div className="container">
          <div ref={catsRef} className="ps-reveal mb-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
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
          </div>

          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3 ps-stagger-group" ref={catsGridRef}>
            {categories.slice(0, 8).map((cat, i) => (
              <div key={cat._id} className="col ps-stagger-item">
                <Link
                  to={`/books?category=${cat._id}`}
                  className="card h-100 border text-decoration-none p-3 bg-light text-dark ps-cat-card"
                >
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle bg-white border d-flex align-items-center justify-content-center me-3 text-dark flex-shrink-0 ps-cat-icon"
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
          5. PLATFORM FEATURES — directional staggered reveal
          =================================================================== */}
      <section className="py-5">
        <div className="container">
          <div ref={featuresRef} className="ps-reveal text-center mb-5" style={{ maxWidth: '640px', margin: '0 auto' }}>
            <span className="badge bg-primary-subtle text-dark border border-warning px-3 py-1 mb-2 fw-medium">
              Platform Features
            </span>
            <h3 className="fw-bold text-dark mb-2">Everything You Need to Manage Your Library</h3>
            <p className="text-muted small">
              Designed specifically for campus students, researchers, and administrators
            </p>
          </div>

          <div className="row g-4">
            {/* Feature 1: from left */}
            <div className="col-12 col-md-6 col-lg-3">
              <div ref={feat1Ref} className="ps-reveal ps-reveal--right h-100">
                <div className="card h-100 border p-4 bg-white ps-feature-card">
                  <div className="rounded-3 bg-primary border border-warning d-inline-flex align-items-center justify-content-center mb-3 ps-feature-icon" style={{ width: '44px', height: '44px' }}>
                    <i className="bi bi-search text-dark fs-5"></i>
                  </div>
                  <h5 className="fw-bold text-dark mb-2">Easy Book Discovery</h5>
                  <p className="text-secondary small mb-0">
                    Search and explore available books quickly with title, author, ISBN, and rack shelf location details.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2: from bottom */}
            <div className="col-12 col-md-6 col-lg-3">
              <div ref={feat2Ref} className="ps-reveal h-100" style={{ transitionDelay: '0.08s' }}>
                <div className="card h-100 border p-4 bg-white ps-feature-card">
                  <div className="rounded-3 bg-primary border border-warning d-inline-flex align-items-center justify-content-center mb-3 ps-feature-icon" style={{ width: '44px', height: '44px' }}>
                    <i className="bi bi-clock-history text-dark fs-5"></i>
                  </div>
                  <h5 className="fw-bold text-dark mb-2">Simple Borrowing Management</h5>
                  <p className="text-secondary small mb-0">
                    Track issued books, 14-day due dates, returns, and transparent penalty calculations seamlessly.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3: from bottom */}
            <div className="col-12 col-md-6 col-lg-3">
              <div ref={feat3Ref} className="ps-reveal h-100" style={{ transitionDelay: '0.16s' }}>
                <div className="card h-100 border p-4 bg-white ps-feature-card">
                  <div className="rounded-3 bg-primary border border-warning d-inline-flex align-items-center justify-content-center mb-3 ps-feature-icon" style={{ width: '44px', height: '44px' }}>
                    <i className="bi bi-person-badge text-dark fs-5"></i>
                  </div>
                  <h5 className="fw-bold text-dark mb-2">Personal Library Profile</h5>
                  <p className="text-secondary small mb-0">
                    Students can view their profile, centralized Library Card ID, borrowing history, and account status.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4: from right */}
            <div className="col-12 col-md-6 col-lg-3">
              <div ref={feat4Ref} className="ps-reveal ps-reveal--left h-100" style={{ transitionDelay: '0.24s' }}>
                <div className="card h-100 border p-4 bg-white ps-feature-card">
                  <div className="rounded-3 bg-primary border border-warning d-inline-flex align-items-center justify-content-center mb-3 ps-feature-icon" style={{ width: '44px', height: '44px' }}>
                    <i className="bi bi-shield-check text-dark fs-5"></i>
                  </div>
                  <h5 className="fw-bold text-dark mb-2">Smart Library Management</h5>
                  <p className="text-secondary small mb-0">
                    Administrators manage books, members, physical inventory movements, audit logs, and institutional reports.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          6. LIBRARY CARD HIGHLIGHT — fade in with shimmer on card ID
          =================================================================== */}
      <section className="py-5 bg-white border-top border-bottom">
        <div className="container">
          <div ref={cardSectionRef} className="row align-items-center g-4 ps-reveal">
            {/* Left Content */}
            <div className="col-12 col-lg-7">
              <span className="badge bg-primary-subtle text-dark border border-warning px-3 py-1 mb-2 fw-medium">
                Centralized Identification
              </span>
              <h3 className="fw-bold text-dark mb-3">
                Your Library. Your Card. Your Identity.
              </h3>
              <p className="text-secondary mb-3" style={{ lineHeight: '1.6' }}>
                Every registered member receives one unique, centralized{' '}
                <strong>12-digit numeric Library Card ID</strong>. This decimal identifier serves as
                your primary campus credential for instant physical book checkout, due date
                verification, and self-service account management.
              </p>
              <ul className="list-unstyled small text-secondary mb-4">
                <li className="mb-2 d-flex align-items-center">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  <span>100% Unique &amp; Decimal-digits Only (0-9)</span>
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
                <Link to="/profile" className="btn btn-outline-dark btn-sm px-3 ps-cta-btn-outline">
                  <i className="bi bi-credit-card-2-front me-1"></i> View My Library Card
                </Link>
              ) : (
                <Link to="/register" className="btn btn-outline-dark btn-sm px-3 ps-cta-btn-outline">
                  <i className="bi bi-person-plus me-1"></i> Get Your Library Card
                </Link>
              )}
            </div>

            {/* Right: Card Mockup */}
            <div className="col-12 col-lg-5 text-center">
              <div
                className="p-4 rounded-4 border bg-light text-start shadow-sm mx-auto ps-float-2"
                style={{ maxWidth: '380px' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center">
                    <img src="/library-logo.png" alt="PustakSetu" width="26" height="26" className="me-2" />
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
                  {/* Shimmer highlight on the card number */}
                  <div className="fs-5 fw-bold text-dark font-monospace mt-1 ps-card-id py-1 px-1">
                    0000 &bull; 0000 &bull; 0001
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
          7. CALL TO ACTION — sequenced reveal
          =================================================================== */}
      <section className="py-5 bg-light" ref={ctaRef}>
        <div className="container py-lg-4 text-center" style={{ maxWidth: '640px' }}>
          <div ref={ctaHeadRef} className="ps-reveal">
            <h3 className="fw-bold text-dark mb-2">Ready to explore the library?</h3>
          </div>
          <div ref={ctaDescRef} className="ps-reveal" style={{ transitionDelay: '0.1s' }}>
            <p className="text-secondary mb-4">
              Find your next book and keep track of your library activity with PustakSetu.
            </p>
          </div>
          <div ref={ctaBtnsRef} className="ps-reveal" style={{ transitionDelay: '0.2s' }}>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              <Link
                to="/books"
                className="btn btn-primary btn-lg text-dark fw-semibold px-4 shadow-sm ps-cta-btn-primary"
              >
                <i className="bi bi-search me-2"></i> Browse Books
              </Link>
              {isAuthenticated ? (
                <Link to="/my-books" className="btn btn-outline-dark btn-lg px-4 ps-cta-btn-outline">
                  <i className="bi bi-journal-bookmark me-2"></i> My Books
                </Link>
              ) : (
                <Link to="/register" className="btn btn-outline-dark btn-lg px-4 ps-cta-btn-outline">
                  <i className="bi bi-person-plus me-2"></i> Create Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
