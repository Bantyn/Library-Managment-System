const axios = require('axios');

const API = 'http://localhost:5000/api';

const runInventoryTests = async () => {
  console.log('===========================================================');
  console.log('🧪 Starting Phase 7 Advanced Inventory Verification Suite');
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
    console.log('\n--- 1. Authentication & Role Permissions ---');
    const adminLoginRes = await axios.post(`${API}/auth/login`, {
      email: 'admin@library.com',
      password: 'admin123',
    });
    assert(adminLoginRes.data.success, 'Admin authenticated successfully');
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // Register test student
    const studentRes = await axios.post(`${API}/auth/register`, {
      name: 'Priya Sharma',
      email: `student_inv_${Date.now()}@library.com`,
      password: 'password123',
      studentId: `INV${Date.now().toString().slice(-4)}`,
      phone: '9812345678',
    });
    assert(studentRes.data.success, 'Student registered successfully');
    const studentToken = studentRes.data.token;
    const studentHeaders = { Authorization: `Bearer ${studentToken}` };

    // Verify student cannot access inventory endpoints (Negative permission check)
    try {
      await axios.get(`${API}/inventory`, { headers: studentHeaders });
      assert(false, 'Student should be rejected from /api/inventory');
    } catch (err) {
      assert(err.response?.status === 403, 'Student blocked from inventory with 403 Forbidden');
    }

    // 2. Category & Book Creation
    console.log('\n--- 2. Book Creation & Automatic Inventory Initialization ---');
    const catsRes = await axios.get(`${API}/categories`);
    const categoryId = catsRes.data.data[0]._id;

    const testIsbn = `978-INV-${Date.now()}`;
    const createBookRes = await axios.post(
      `${API}/books`,
      {
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        isbn: testIsbn,
        category: categoryId,
        totalCopies: 10,
        availableCopies: 10,
        purchasePrice: 799,
        shelfLocation: 'Stack E-4',
      },
      { headers: adminHeaders }
    );
    assert(createBookRes.data.success, 'Book created in catalog');
    const bookId = createBookRes.data.data._id;

    // Verify Inventory record was automatically created
    const invRes = await axios.get(`${API}/inventory/${bookId}`, { headers: adminHeaders });
    assert(invRes.data.success, 'Inventory record exists for created book');
    assert(invRes.data.data.totalCopies === 10, 'Initial totalCopies is 10');
    assert(invRes.data.data.availableCopies === 10, 'Initial availableCopies is 10');
    assert(invRes.data.data.issuedCopies === 0, 'Initial issuedCopies is 0');
    assert(invRes.data.data.status === 'IN_STOCK', 'Stock status derived as IN_STOCK');

    // 3. Test 1 — Stock In
    console.log('\n--- 3. Stock In (Adding Physical Copies) ---');
    const stockInRes = await axios.post(
      `${API}/inventory/${bookId}/stock-in`,
      { quantity: 5, reason: 'Procured 5 additional copies from distributor' },
      { headers: adminHeaders }
    );
    assert(stockInRes.data.success, 'Stock in request succeeded');
    assert(stockInRes.data.data.inventory.totalCopies === 15, 'Total copies incremented to 15 (10 + 5)');
    assert(stockInRes.data.data.inventory.availableCopies === 15, 'Available copies incremented to 15');
    assert(stockInRes.data.data.transaction.type === 'STOCK_IN', 'Transaction logged with type STOCK_IN');

    // 4. Test 2 — Issue Integration
    console.log('\n--- 4. Issue Book Inventory Synchronization ---');
    const issueRes = await axios.post(
      `${API}/issues`,
      {
        bookId,
        studentId: studentRes.data.user.id || studentRes.data.user._id,
      },
      { headers: adminHeaders }
    );
    assert(issueRes.data.success, 'Book issued to student');
    const issueId = issueRes.data.data._id;

    const invAfterIssue = await axios.get(`${API}/inventory/${bookId}`, { headers: adminHeaders });
    assert(invAfterIssue.data.data.availableCopies === 14, 'Available copies decremented to 14');
    assert(invAfterIssue.data.data.issuedCopies === 1, 'Issued copies incremented to 1');

    // 5. Test 3 — Return Integration
    console.log('\n--- 5. Return Book Inventory Synchronization ---');
    const returnRes = await axios.put(`${API}/issues/${issueId}/return`, {}, { headers: adminHeaders });
    assert(returnRes.data.success, 'Book returned');

    const invAfterReturn = await axios.get(`${API}/inventory/${bookId}`, { headers: adminHeaders });
    assert(invAfterReturn.data.data.availableCopies === 15, 'Available copies restored to 15');
    assert(invAfterReturn.data.data.issuedCopies === 0, 'Issued copies restored to 0');

    // 6. Test 4 — Damage Flow
    console.log('\n--- 6. Damage Tracking ---');
    const damageRes = await axios.post(
      `${API}/inventory/${bookId}/damage`,
      { quantity: 1, reason: 'Pages torn by borrower' },
      { headers: adminHeaders }
    );
    assert(damageRes.data.success, 'Damaged copy recorded');
    assert(damageRes.data.data.inventory.availableCopies === 14, 'Available copies decremented to 14');
    assert(damageRes.data.data.inventory.damagedCopies === 1, 'Damaged copies incremented to 1');
    assert(damageRes.data.data.inventory.totalCopies === 15, 'Total copies preserved at 15');

    // 7. Test 5 — Lost Flow
    console.log('\n--- 7. Lost Tracking ---');
    const lostRes = await axios.post(
      `${API}/inventory/${bookId}/lost`,
      { quantity: 1, reason: 'Misplaced in reading room' },
      { headers: adminHeaders }
    );
    assert(lostRes.data.success, 'Lost copy recorded');
    assert(lostRes.data.data.inventory.availableCopies === 13, 'Available copies decremented to 13');
    assert(lostRes.data.data.inventory.lostCopies === 1, 'Lost copies incremented to 1');

    // 8. Test 6 — Recovery Flow
    console.log('\n--- 8. Lost Book Recovery ---');
    const recoverRes = await axios.post(
      `${API}/inventory/${bookId}/recover`,
      { quantity: 1, reason: 'Found behind library stack rack 4' },
      { headers: adminHeaders }
    );
    assert(recoverRes.data.success, 'Recovered book restored');
    assert(recoverRes.data.data.inventory.availableCopies === 14, 'Available copies incremented back to 14');
    assert(recoverRes.data.data.inventory.lostCopies === 0, 'Lost copies decremented to 0');

    // 9. Test 7 — Inventory Adjustment
    console.log('\n--- 9. Administrative Stock Adjustment ---');
    const adjustRes = await axios.post(
      `${API}/inventory/${bookId}/adjust`,
      { adjustmentType: 'increase', quantity: 2, reason: 'Audit correction: found unregistered donation copies' },
      { headers: adminHeaders }
    );
    assert(adjustRes.data.success, 'Stock adjustment logged');
    assert(adjustRes.data.data.inventory.totalCopies === 17, 'Total copies increased to 17 (15 + 2)');
    assert(adjustRes.data.data.inventory.availableCopies === 16, 'Available copies increased to 16 (14 + 2)');

    // 10. Test 8 — Physical Stock Check
    console.log('\n--- 10. Physical Stock Reconciliation ---');
    const physicalRes = await axios.post(
      `${API}/inventory/${bookId}/physical-check`,
      { physicalCount: 16, reason: 'Annual physical stock verification matched' },
      { headers: adminHeaders }
    );
    assert(physicalRes.data.success, 'Physical count audit succeeded');

    // 11. Test 9 — Purchase Physical Fulfillment Flow
    console.log('\n--- 11. Purchase Physical Fulfillment (STOCK_OUT) ---');
    // Student initiates and pays for book
    const orderRes = await axios.post(
      `${API}/purchases/create-order`,
      { bookId },
      { headers: studentHeaders }
    );
    const { purchaseId, orderId } = orderRes.data.data;
    await axios.post(
      `${API}/purchases/verify`,
      {
        purchaseId,
        razorpayOrderId: orderId,
        razorpayPaymentId: `pay_ful_${Date.now()}`,
        razorpaySignature: `mock_sig_${orderId}`,
      },
      { headers: studentHeaders }
    );

    // Verify stock is UNCHANGED before physical fulfillment
    const invBeforeFulfill = await axios.get(`${API}/inventory/${bookId}`, { headers: adminHeaders });
    assert(invBeforeFulfill.data.data.availableCopies === 16, 'Available stock unchanged on payment');

    // Admin marks order as fulfilled
    const fulfillRes = await axios.put(
      `${API}/purchases/${purchaseId}/status`,
      { status: 'fulfilled' },
      { headers: adminHeaders }
    );
    assert(fulfillRes.data.success, 'Purchase fulfilled by admin');

    const invAfterFulfill = await axios.get(`${API}/inventory/${bookId}`, { headers: adminHeaders });
    assert(invAfterFulfill.data.data.availableCopies === 15, 'Available copies decremented to 15 upon physical fulfillment');
    assert(invAfterFulfill.data.data.totalCopies === 16, 'Total copies decremented to 16 upon physical fulfillment');

    // 12. Test 10 — Mathematical Invariant Check
    console.log('\n--- 12. Mathematical Invariant Verification ---');
    const finalInv = invAfterFulfill.data.data;
    const computedSum =
      finalInv.availableCopies +
      finalInv.issuedCopies +
      finalInv.reservedCopies +
      finalInv.damagedCopies +
      finalInv.lostCopies;
    assert(
      finalInv.totalCopies === computedSum,
      `Formula Invariant verified: Total (${finalInv.totalCopies}) === Available (${finalInv.availableCopies}) + Issued (${finalInv.issuedCopies}) + Reserved (${finalInv.reservedCopies}) + Damaged (${finalInv.damagedCopies}) + Lost (${finalInv.lostCopies})`
    );

    // 13. Test 11 — Negative Edge Cases
    console.log('\n--- 13. Negative Integrity Enforcement ---');
    // Cannot damage more than available
    try {
      await axios.post(
        `${API}/inventory/${bookId}/damage`,
        { quantity: 999, reason: 'Excessive damage' },
        { headers: adminHeaders }
      );
      assert(false, 'Should reject damaging more than available stock');
    } catch (err) {
      assert(err.response?.status >= 400, 'Rejection of excessive damage enforced');
    }

    // Cannot recover when lost is 0
    try {
      await axios.post(
        `${API}/inventory/${bookId}/recover`,
        { quantity: 5, reason: 'Phantom recovery' },
        { headers: adminHeaders }
      );
      assert(false, 'Should reject recovering when lostCopies is 0');
    } catch (err) {
      assert(err.response?.status >= 400, 'Rejection of phantom recovery enforced');
    }

    // 14. Test 12 — Reports & CSV Export
    console.log('\n--- 14. Inventory Reports & CSV Streaming ---');
    const summaryCsvRes = await axios.get(`${API}/reports/inventory-summary?format=csv`, { headers: adminHeaders });
    assert(summaryCsvRes.status === 200, 'Inventory summary CSV generated');
    assert(summaryCsvRes.data.includes('Book Title'), 'Summary CSV contains proper headers');

    const movementCsvRes = await axios.get(`${API}/reports/inventory-movement?format=csv`, { headers: adminHeaders });
    assert(movementCsvRes.status === 200, 'Inventory movement CSV generated');
    assert(movementCsvRes.data.includes('STOCK_IN'), 'Movement CSV contains STOCK_IN audit line');

    const lowStockCsvRes = await axios.get(`${API}/reports/low-stock?format=csv`, { headers: adminHeaders });
    assert(lowStockCsvRes.status === 200, 'Low stock CSV generated');

    const lostDamagedCsvRes = await axios.get(`${API}/reports/lost-damaged?format=csv`, { headers: adminHeaders });
    assert(lostDamagedCsvRes.status === 200, 'Lost/Damaged CSV generated');

    console.log('\n===========================================================');
    console.log(`📊 Phase 7 Inventory Test Results: ${passed} Passed | ${failed} Failed`);
    console.log('===========================================================');
  } catch (err) {
    console.error('Test execution failed:', err.response?.data || err.message);
    failed++;
  }
};

runInventoryTests();
