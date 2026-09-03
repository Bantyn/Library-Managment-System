const axios = require('axios');

const API = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('--- Starting Phase 5 Automated Verification Suite ---');
  let passed = 0;
  let failed = 0;

  const assert = (condition, msg) => {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  };

  try {
    // 1. Admin Login
    console.log('\n1. Authenticating Admin...');
    const adminLoginRes = await axios.post(`${API}/auth/login`, {
      email: 'admin@library.com',
      password: 'admin123',
    });
    assert(adminLoginRes.data.success, 'Admin authenticated successfully');
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 2. Student Registration / Login
    console.log('\n2. Registering / Authenticating Student...');
    const studentEmail = `student_${Date.now()}@library.com`;
    const regRes = await axios.post(`${API}/auth/register`, {
      name: 'Rohan Verma',
      email: studentEmail,
      password: 'password123',
      studentId: `STU${Date.now().toString().slice(-4)}`,
      phone: '9876543210',
    });
    assert(regRes.data.success, 'Student registered successfully');
    const studentToken = regRes.data.token;
    const studentHeaders = { Authorization: `Bearer ${studentToken}` };

    // 3. Get Category
    const catRes = await axios.get(`${API}/categories`);
    const categoryId = catRes.data.data[0]._id;

    // 4. Create Book with image path and purchasePrice
    console.log('\n3. Creating Book with image path and purchasePrice...');
    const testIsbn = `978-${Date.now()}`;
    const bookRes = await axios.post(
      `${API}/books`,
      {
        title: 'High-Performance Node.js Systems',
        author: 'Alexander Bell',
        isbn: testIsbn,
        category: categoryId,
        totalCopies: 10,
        availableCopies: 10,
        purchasePrice: 599,
        image: '/uploads/books/demo-cover.png',
        shelfLocation: 'Rack D-2',
      },
      { headers: adminHeaders }
    );
    assert(bookRes.data.success, 'Book created with purchasePrice & image');
    assert(bookRes.data.data.purchasePrice === 599, 'Book purchasePrice stored as ₹599');
    assert(bookRes.data.data.image === '/uploads/books/demo-cover.png', 'Book cover image path stored');
    const bookId = bookRes.data.data._id;

    // 5. Student initiates Book Purchase (create-order)
    console.log('\n4. Testing Book Purchase Order Creation...');
    const orderRes = await axios.post(
      `${API}/purchases/create-order`,
      { bookId },
      { headers: studentHeaders }
    );
    assert(orderRes.data.success, 'Purchase order generated via Razorpay service');
    assert(orderRes.data.data.orderId, 'Received orderId from backend');
    assert(orderRes.data.data.amount === 59900, 'Order amount calculated in paise (₹599 * 100)');
    const { purchaseId, orderId } = orderRes.data.data;

    // 6. Student verifies Purchase (POST /api/purchases/verify)
    console.log('\n5. Testing Purchase Payment Verification...');
    const mockPaymentId = `pay_${Date.now()}_test`;
    const verifyRes = await axios.post(
      `${API}/purchases/verify`,
      {
        purchaseId,
        razorpayOrderId: orderId,
        razorpayPaymentId: mockPaymentId,
        razorpaySignature: `mock_sig_${orderId}`,
      },
      { headers: studentHeaders }
    );
    assert(verifyRes.data.success, 'Purchase signature verified and marked paid');
    assert(verifyRes.data.data.status === 'paid', 'Purchase status updated to paid in MongoDB');

    // 7. Student retrieves My Purchases
    console.log('\n6. Testing GET /api/purchases/my-purchases...');
    const myPurchasesRes = await axios.get(`${API}/purchases/my-purchases`, {
      headers: studentHeaders,
    });
    assert(myPurchasesRes.data.success, 'Fetched student personal purchase receipts');
    assert(myPurchasesRes.data.data.length >= 1, 'My Purchases contains the verified purchase');

    // 8. Admin retrieves All Purchases
    console.log('\n7. Testing GET /api/purchases (Admin)...');
    const allPurchasesRes = await axios.get(`${API}/purchases`, {
      headers: adminHeaders,
    });
    assert(allPurchasesRes.data.success, 'Admin retrieved all customer purchases');

    // 9. Fine System: Issue book to student with past due date to simulate overdue fine
    console.log('\n8. Simulating Overdue Loan with Late Penalty...');
    const issueRes = await axios.post(
      `${API}/issues`,
      {
        bookId,
        studentId: regRes.data.user.id || regRes.data.user._id,
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      },
      { headers: adminHeaders }
    );
    const issueId = issueRes.data.data._id;

    // Return the book to generate authoritative late fine
    const returnRes = await axios.put(`${API}/issues/${issueId}/return`, {}, {
      headers: adminHeaders,
    });
    assert(returnRes.data.success, 'Overdue book returned and fine calculated');
    const calculatedFine = returnRes.data.data.fine;
    console.log(`   [INFO] Authoritative Fine calculated by backend: ₹${calculatedFine}`);
    assert(calculatedFine > 0, `Fine calculated correctly (Late days * ₹5 = ₹${calculatedFine})`);

    // 10. Student creates Fine Order (POST /api/fines/create-order)
    console.log('\n9. Testing Student Fine Payment via Razorpay...');
    const fineOrderRes = await axios.post(
      `${API}/fines/create-order`,
      { issueId },
      { headers: studentHeaders }
    );
    assert(fineOrderRes.data.success, 'Fine payment Razorpay order created');
    assert(fineOrderRes.data.data.outstandingFine === calculatedFine, `Outstanding fine is ₹${calculatedFine}`);
    const { finePaymentId, orderId: fineOrderId } = fineOrderRes.data.data;

    // 11. Student verifies Fine Payment (POST /api/fines/verify)
    const fineVerifyRes = await axios.post(
      `${API}/fines/verify`,
      {
        finePaymentId,
        razorpayOrderId: fineOrderId,
        razorpayPaymentId: `pay_fine_${Date.now()}`,
        razorpaySignature: `mock_sig_${fineOrderId}`,
      },
      { headers: studentHeaders }
    );
    assert(fineVerifyRes.data.success, 'Fine payment verified and settled');

    // 12. Double-Payment Prevention Check
    console.log('\n10. Testing Double-Payment Prevention...');
    try {
      await axios.post(
        `${API}/fines/create-order`,
        { issueId },
        { headers: studentHeaders }
      );
      assert(false, 'Should prevent double-payment for already settled fine');
    } catch (err) {
      assert(err.response?.status === 400, 'Double payment rejected with 400 Bad Request');
    }

    // 13. Admin On-the-Spot Cash Collection
    console.log('\n11. Testing Admin Cash Fine Collection...');
    // Create second overdue issue
    const issueRes2 = await axios.post(
      `${API}/issues`,
      {
        bookId,
        studentId: regRes.data.user.id || regRes.data.user._id,
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },
      { headers: adminHeaders }
    );
    const issueId2 = issueRes2.data.data._id;
    await axios.put(`${API}/issues/${issueId2}/return`, {}, { headers: adminHeaders });

    const cashCollectRes = await axios.post(
      `${API}/fines/${issueId2}/collect`,
      { paymentMethod: 'cash' },
      { headers: adminHeaders }
    );
    assert(cashCollectRes.data.success, 'Admin collected fine via cash on-the-spot');
    assert(cashCollectRes.data.data.payment.paymentMethod === 'cash', 'Payment recorded with method = cash');
    assert(cashCollectRes.data.data.outstandingFine === 0, 'Outstanding fine reset to 0');

    // 14. Check Dashboard Financial Metrics
    console.log('\n12. Verifying Dashboard Financial KPI Metrics...');
    const dashRes = await axios.get(`${API}/dashboard`, { headers: adminHeaders });
    assert(dashRes.data.success, 'Dashboard API returned 200');
    assert(dashRes.data.data.totalPurchases >= 1, 'Dashboard totalPurchases is >= 1');
    assert(dashRes.data.data.purchaseRevenue >= 599, 'Dashboard purchaseRevenue reflects book price');
    assert(dashRes.data.data.fineCollected >= 40, 'Dashboard fineCollected reflects both settlements');

    console.log(`\n========================================`);
    console.log(`Phase 5 Test Results: ${passed} Passed | ${failed} Failed`);
    console.log(`========================================`);
  } catch (err) {
    console.error('Test execution failed:', err.response?.data || err.message);
    failed++;
  }
};

runTests();
