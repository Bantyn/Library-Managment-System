/**
 * Automated API Test Suite for Bachelor-level Library Management System
 * Tests all endpoints, authentication, authorization, and business logic.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

let adminToken = '';
let studentToken = '';
let createdCategoryId = '';
let createdBookId = '';
let studentUserId = '';
let createdIssueId = '';

let passedTests = 0;
let failedTests = 0;

const assert = (condition, testName, details = '') => {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    failedTests++;
  }
};

const runTests = async () => {
  console.log('\n====================================================');
  console.log('🧪 Starting Automated Library Management API Tests');
  console.log(`📍 Testing Target: ${BASE_URL}`);
  console.log('====================================================\n');

  try {
    // -----------------------------------------------------------------
    // 1. Root & Health Check
    // -----------------------------------------------------------------
    console.log('--- 1. API Health & Status ---');
    const healthRes = await fetch(`${BASE_URL}/`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.success === true, 'Root Health Check GET /');

    const apiRes = await fetch(`${BASE_URL}/api`);
    const apiData = await apiRes.json();
    assert(apiRes.status === 200 && apiData.endpoints !== undefined, 'API Spec Discovery GET /api');

    // -----------------------------------------------------------------
    // 2. Authentication - Admin Login
    // -----------------------------------------------------------------
    console.log('\n--- 2. Authentication (Admin) ---');
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@library.com',
        password: 'admin123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    assert(
      adminLoginRes.status === 200 && adminLoginData.token && adminLoginData.user.role === 'admin',
      'Admin Login (admin@library.com / admin123)',
      adminLoginData.message
    );
    adminToken = adminLoginData.token;

    // -----------------------------------------------------------------
    // 3. Categories Management (Admin)
    // -----------------------------------------------------------------
    console.log('\n--- 3. Category Management ---');
    const uniqueCatName = `Test Category ${Date.now()}`;
    const createCatRes = await fetch(`${BASE_URL}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: uniqueCatName,
        description: 'Automated test category description',
      }),
    });
    const createCatData = await createCatRes.json();
    assert(createCatRes.status === 201 && createCatData.data._id, 'Create Category (POST /api/categories)');
    createdCategoryId = createCatData.data?._id;

    // Get categories list
    const getCatsRes = await fetch(`${BASE_URL}/api/categories`);
    const getCatsData = await getCatsRes.json();
    assert(
      getCatsRes.status === 200 && Array.isArray(getCatsData.data),
      'Get All Categories (GET /api/categories)'
    );

    // -----------------------------------------------------------------
    // 4. Books Management (Admin)
    // -----------------------------------------------------------------
    console.log('\n--- 4. Book Management ---');
    const uniqueIsbn = `ISBN-${Date.now()}`;
    const createBookRes = await fetch(`${BASE_URL}/api/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Mastering Full-Stack JavaScript',
        author: 'Brendan Eich',
        isbn: uniqueIsbn,
        publisher: 'Tech Academy Press',
        publicationYear: 2026,
        category: createdCategoryId,
        totalCopies: 2,
        availableCopies: 2,
        shelfLocation: 'Shelf-A1',
        description: 'Comprehensive guide to modern MERN development',
      }),
    });
    const createBookData = await createBookRes.json();
    assert(
      createBookRes.status === 201 && createBookData.data._id && createBookData.data.availableCopies === 2,
      'Create Book with Initial 2 Copies (POST /api/books)',
      createBookData.message
    );
    createdBookId = createBookData.data?._id;

    // Search Books
    const searchBookRes = await fetch(`${BASE_URL}/api/books?search=JavaScript`);
    const searchBookData = await searchBookRes.json();
    assert(
      searchBookRes.status === 200 && searchBookData.data.length > 0,
      'Search Books Query (GET /api/books?search=JavaScript)'
    );

    // Get Single Book by ID
    const getBookRes = await fetch(`${BASE_URL}/api/books/${createdBookId}`);
    const getBookData = await getBookRes.json();
    assert(
      getBookRes.status === 200 && getBookData.data.title === 'Mastering Full-Stack JavaScript',
      'Get Book By ID with Populated Category (GET /api/books/:id)'
    );

    // -----------------------------------------------------------------
    // 5. Student Registration & Authentication
    // -----------------------------------------------------------------
    console.log('\n--- 5. Student Registration & Auth ---');
    const uniqueStudentEmail = `student_${Date.now()}@university.edu`;
    const uniqueStudentId = `STU-${Date.now().toString().slice(-4)}`;

    const regStudentRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarav Sharma',
        email: uniqueStudentEmail,
        password: 'studentpassword123',
        studentId: uniqueStudentId,
        phone: '9876543210',
        role: 'admin', // Attempting privilege escalation
      }),
    });
    const regStudentData = await regStudentRes.json();
    assert(
      regStudentRes.status === 201 &&
        regStudentData.user.role === 'student' &&
        regStudentData.user.password === undefined,
      'Register Student & Enforce Student Role (POST /api/auth/register)',
      regStudentData.message
    );
    studentToken = regStudentData.token;
    studentUserId = regStudentData.user.id;

    // Student profile
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const meData = await meRes.json();
    assert(
      meRes.status === 200 && meData.user.studentId === uniqueStudentId,
      'Get Authenticated User Profile (GET /api/auth/me)'
    );

    // -----------------------------------------------------------------
    // 6. Security & Role-Based Authorization Guard
    // -----------------------------------------------------------------
    console.log('\n--- 6. Security & Authorization Guard ---');
    const unauthorizedBookRes = await fetch(`${BASE_URL}/api/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`, // Student attempting admin action
      },
      body: JSON.stringify({
        title: 'Hacked Book Entry',
        author: 'Attacker',
        isbn: 'HACK-1234',
        category: createdCategoryId,
        totalCopies: 1,
      }),
    });
    assert(
      unauthorizedBookRes.status === 403,
      'Prevent Student from Adding Books (403 Forbidden)',
      `Received status: ${unauthorizedBookRes.status}`
    );

    // -----------------------------------------------------------------
    // 7. Circulation: Issue Book
    // -----------------------------------------------------------------
    console.log('\n--- 7. Issue Book Circulation Logic ---');
    const issueRes = await fetch(`${BASE_URL}/api/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        bookId: createdBookId,
        studentId: studentUserId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    const issueData = await issueRes.json();
    assert(
      issueRes.status === 201 && issueData.data._id && issueData.data.status === 'issued',
      'Issue Book to Student (POST /api/issues)',
      issueData.message
    );
    createdIssueId = issueData.data?._id;

    // Verify book availableCopies decreased from 2 to 1
    const checkBookRes = await fetch(`${BASE_URL}/api/books/${createdBookId}`);
    const checkBookData = await checkBookRes.json();
    assert(
      checkBookData.data.availableCopies === 1,
      'Verify Stock Decrement: availableCopies decreased to 1'
    );

    // -----------------------------------------------------------------
    // 8. Business Rule: Prevent Double-Issuing Same Book to Same Student
    // -----------------------------------------------------------------
    console.log('\n--- 8. Double-Issue Prevention Rule ---');
    const doubleIssueRes = await fetch(`${BASE_URL}/api/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        bookId: createdBookId,
        studentId: studentUserId,
      }),
    });
    assert(
      doubleIssueRes.status === 400,
      'Block Issuing Same Book Twice to Same Student (400 Bad Request)'
    );

    // -----------------------------------------------------------------
    // 9. Circulation: Return Book & Stock Replenishment
    // -----------------------------------------------------------------
    console.log('\n--- 9. Return Book Circulation Logic ---');
    const returnRes = await fetch(`${BASE_URL}/api/issues/${createdIssueId}/return`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const returnData = await returnRes.json();
    assert(
      returnRes.status === 200 && returnData.data.status === 'returned',
      'Return Book Successfully (PUT /api/issues/:id/return)',
      returnData.message
    );

    // Verify book availableCopies increased back to 2
    const checkRestoredBookRes = await fetch(`${BASE_URL}/api/books/${createdBookId}`);
    const checkRestoredBookData = await checkRestoredBookRes.json();
    assert(
      checkRestoredBookData.data.availableCopies === 2,
      'Verify Stock Replenishment: availableCopies restored to 2'
    );

    // Try to return already returned book
    const duplicateReturnRes = await fetch(`${BASE_URL}/api/issues/${createdIssueId}/return`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assert(
      duplicateReturnRes.status === 400,
      'Reject Returning Already Returned Book (400 Bad Request)'
    );

    // -----------------------------------------------------------------
    // 10. Member Management & Inactive Borrow Prevention
    // -----------------------------------------------------------------
    console.log('\n--- 10. Member Management & Status Rule ---');
    // Deactivate student
    const deactivateRes = await fetch(`${BASE_URL}/api/members/${studentUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: false }),
    });
    const deactivateData = await deactivateRes.json();
    assert(
      deactivateRes.status === 200 && deactivateData.data.isActive === false,
      'Deactivate Member Account (PUT /api/members/:id)'
    );

    // Attempt issue to inactive student
    const issueToInactiveRes = await fetch(`${BASE_URL}/api/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        bookId: createdBookId,
        studentId: studentUserId,
      }),
    });
    assert(
      issueToInactiveRes.status === 400,
      'Block Issuing Book to Inactive/Deactivated Student (400 Bad Request)'
    );

    // Reactivate student
    await fetch(`${BASE_URL}/api/members/${studentUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: true }),
    });

    // -----------------------------------------------------------------
    // 11. Member Borrowing History
    // -----------------------------------------------------------------
    console.log('\n--- 11. Member Borrowing History ---');
    const memberHistoryRes = await fetch(`${BASE_URL}/api/members/${studentUserId}/issues`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const memberHistoryData = await memberHistoryRes.json();
    assert(
      memberHistoryRes.status === 200 && Array.isArray(memberHistoryData.data),
      'Student Viewing Own Borrowing History (GET /api/members/:id/issues)'
    );

    // -----------------------------------------------------------------
    // 12. Dashboard Statistics & Analytics
    // -----------------------------------------------------------------
    console.log('\n--- 12. Dashboard Analytics ---');
    const dashboardRes = await fetch(`${BASE_URL}/api/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dashboardData = await dashboardRes.json();
    assert(
      dashboardRes.status === 200 &&
        typeof dashboardData.data.totalBooks === 'number' &&
        typeof dashboardData.data.totalStudents === 'number' &&
        Array.isArray(dashboardData.data.recentIssues) &&
        Array.isArray(dashboardData.data.recentBooks),
      'Admin Dashboard Analytics & Activity Feed (GET /api/dashboard)'
    );

    // -----------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------
    console.log('\n====================================================');
    console.log(`📊 Test Summary: ${passedTests} Passed | ${failedTests} Failed`);
    console.log('====================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Fatal Test Execution Error:', error.message);
    process.exit(1);
  }
};

runTests();
