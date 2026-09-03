const axios = require('axios');

const API = 'http://localhost:5000/api';

const runPhase8Tests = async () => {
  console.log('===========================================================');
  console.log('🧪 Starting Phase 8 Centralized Library Card Verification');
  console.log('===========================================================');
  let passed = 0;
  let failed = 0;

  const assert = (condition, msg) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      failed++;
    }
  };

  try {
    // 1. Authenticate Admin
    console.log('\n--- 1. Admin Authentication ---');
    const adminLoginRes = await axios.post(`${API}/auth/login`, {
      email: 'admin@library.com',
      password: 'admin123',
    });
    assert(adminLoginRes.data.success, 'Admin authenticated');
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 2. Student Registration & Centralized 12-digit ID Generation
    console.log('\n--- 2. Centralized 12-Digit Decimal ID Generation ---');
    const student1Res = await axios.post(`${API}/auth/register`, {
      name: 'Aditya Birla',
      email: `aditya_${Date.now()}@university.edu`,
      password: 'password123',
      studentId: `MCA${Date.now().toString().slice(-4)}`,
      phone: '9876543210',
    });
    assert(student1Res.data.success, 'Student 1 registered');
    const cardId1 = student1Res.data.user.libraryCardId;
    assert(typeof cardId1 === 'string', 'Library Card ID is stored as string');
    assert(cardId1.length === 12, `Library Card ID length is exactly 12 (${cardId1})`);
    assert(/^[0-9]{12}$/.test(cardId1), `Library Card ID contains only decimal digits (${cardId1})`);

    // Register second student and verify sequential increment
    const student2Res = await axios.post(`${API}/auth/register`, {
      name: 'Sneha Patel',
      email: `sneha_${Date.now()}@university.edu`,
      password: 'password123',
      studentId: `BTECH${Date.now().toString().slice(-4)}`,
      phone: '9876543211',
    });
    assert(student2Res.data.success, 'Student 2 registered');
    const cardId2 = student2Res.data.user.libraryCardId;
    assert(cardId2.length === 12, `Student 2 Library Card ID length is 12 (${cardId2})`);
    assert(cardId2 !== cardId1, `Student 2 card ID is unique (${cardId2} !== ${cardId1})`);
    assert(
      parseInt(cardId2, 10) === parseInt(cardId1, 10) + 1,
      `Sequential increment verified (${cardId1} -> ${cardId2})`
    );

    // 3. Search Member by Library Card ID
    console.log('\n--- 3. Centralized Search by Library Card ID ---');
    const searchRes = await axios.get(`${API}/members?libraryCardId=${cardId1}`, {
      headers: adminHeaders,
    });
    assert(searchRes.data.success, 'Search by libraryCardId succeeded');
    assert(searchRes.data.count === 1, 'Exactly one matching member returned');
    assert(searchRes.data.data[0].name === 'Aditya Birla', 'Returned correct student');
    assert(searchRes.data.data[0].libraryCardId === cardId1, 'Returned student has correct libraryCardId');

    // General text search by Library Card ID
    const generalSearchRes = await axios.get(`${API}/members?search=${cardId2}`, {
      headers: adminHeaders,
    });
    assert(generalSearchRes.data.count === 1, 'General text search found member via 12-digit card ID');

    // 4. Issue Book Using Library Card ID
    console.log('\n--- 4. Circulation Issue via Library Card ID ---');
    const booksRes = await axios.get(`${API}/books`);
    const availableBook = booksRes.data.data.find((b) => b.availableCopies > 0);
    assert(availableBook !== undefined, `Found book with available stock (${availableBook?.title})`);

    const issueRes = await axios.post(
      `${API}/issues`,
      {
        bookId: availableBook._id,
        libraryCardId: cardId1,
      },
      { headers: adminHeaders }
    );
    assert(issueRes.data.success, 'Book issued using 12-digit Library Card ID');
    assert(
      issueRes.data.data.student._id.toString() === student1Res.data.user.id.toString(),
      'Issue internally resolved Library Card ID to student User._id'
    );

    // 5. Immutability Test (Attempting to modify libraryCardId)
    console.log('\n--- 5. Strict Immutability Protection ---');
    try {
      await axios.put(
        `${API}/members/${student1Res.data.user.id}`,
        { libraryCardId: '999999999999' },
        { headers: adminHeaders }
      );
      assert(false, 'Should reject attempting to alter immutable Library Card ID');
    } catch (err) {
      assert(err.response?.status === 400, 'Rejection of Library Card ID alteration enforced with 400');
    }

    // 6. Soft Delete & Non-Reuse Verification
    console.log('\n--- 6. Soft Delete & ID Permanence Verification ---');
    const deleteRes = await axios.delete(`${API}/members/${student2Res.data.user.id}`, {
      headers: adminHeaders,
    });
    assert(deleteRes.data.success, 'Student soft-deleted');

    // Verify card ID is still preserved on deactivated member
    const memberAfterDel = await axios.get(`${API}/members/${student2Res.data.user.id}`, {
      headers: adminHeaders,
    });
    assert(
      memberAfterDel.data.data.libraryCardId === cardId2,
      'Library Card ID permanently preserved on soft-deleted record'
    );

    // Register a 3rd student and verify it NEVER reuses cardId2
    const student3Res = await axios.post(`${API}/auth/register`, {
      name: 'Vikas Gupta',
      email: `vikas_${Date.now()}@university.edu`,
      password: 'password123',
      studentId: `BCA${Date.now().toString().slice(-4)}`,
      phone: '9876543212',
    });
    const cardId3 = student3Res.data.user.libraryCardId;
    assert(cardId3 !== cardId2, `Soft-deleted Card ID was never recycled (${cardId3} !== ${cardId2})`);
    assert(parseInt(cardId3, 10) > parseInt(cardId2, 10), 'Counter continued forward sequentially');

    // 7. Profile API Response Verification
    console.log('\n--- 7. Profile API Library Card Verification ---');
    const studentLogin = await axios.post(`${API}/auth/login`, {
      email: student1Res.data.user.email,
      password: 'password123',
    });
    assert(studentLogin.data.user.libraryCardId === cardId1, 'Login response includes libraryCardId');

    const meRes = await axios.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${studentLogin.data.token}` },
    });
    assert(meRes.data.user.libraryCardId === cardId1, 'GET /api/auth/me returns libraryCardId');

    // 8. Member Report CSV Verification
    console.log('\n--- 8. Member Report with Library Card ID CSV Export ---');
    const memberReportRes = await axios.get(`${API}/reports/members?format=csv`, {
      headers: adminHeaders,
    });
    assert(memberReportRes.status === 200, 'Member report generated');
    assert(
      memberReportRes.data.includes('"Library Card ID"'),
      'Member report CSV header includes "Library Card ID"'
    );
    assert(
      memberReportRes.data.includes(cardId1),
      `Member report CSV includes student 12-digit ID (${cardId1})`
    );

    console.log('\n===========================================================');
    console.log(`📊 Phase 8 Library Card Test Results: ${passed} Passed | ${failed} Failed`);
    console.log('===========================================================');
  } catch (err) {
    console.error('Test execution error:', err.response?.data || err.message);
    failed++;
  }
};

runPhase8Tests();
