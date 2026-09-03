const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const API = 'http://localhost:5000/api';

const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Book = require('./src/models/Book');
const Counter = require('./src/models/Counter');
const Inventory = require('./src/models/Inventory');
const Issue = require('./src/models/Issue');
const FinePayment = require('./src/models/FinePayment');
const Purchase = require('./src/models/Purchase');

const runCleanSeederVerification = async () => {
  console.log('===========================================================');
  console.log('🧪 Starting Clean Database Verification Suite');
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
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/library_management';
    await mongoose.connect(mongoUri);

    // 1. Authentication Verification: admin@gmail.com / admin123
    console.log('\n--- 1. Authentication Verification ---');
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'admin@gmail.com',
      password: 'admin123',
    });
    assert(loginRes.data.success, 'Login API returned 200 OK for admin@gmail.com');
    assert(loginRes.data.user.email === 'admin@gmail.com', 'Authenticated user email matches admin@gmail.com');
    assert(loginRes.data.user.role === 'admin', 'Authenticated user has admin role');
    assert(typeof loginRes.data.token === 'string', 'JWT bearer token generated');

    // 2. Master Catalog & Categories Verification
    console.log('\n--- 2. Categories & Books Catalog ---');
    const categoryCount = await Category.countDocuments();
    assert(categoryCount === 14, `Categories seeded: ${categoryCount} (14 disciplines)`);

    const bookCount = await Book.countDocuments();
    assert(bookCount === 44, `Books catalog seeded: ${bookCount} books`);

    // 3. Physical Inventory & Mathematical Invariant Verification
    console.log('\n--- 3. Inventory Stock Verification ---');
    const inventoryCount = await Inventory.countDocuments();
    assert(inventoryCount === bookCount, `Physical inventory count (${inventoryCount}) matches book catalog (${bookCount})`);

    const inventories = await Inventory.find({});
    let allAvailableEqualTotal = true;
    let allInvariantsValid = true;

    for (const inv of inventories) {
      const sum =
        (inv.availableCopies || 0) +
        (inv.issuedCopies || 0) +
        (inv.reservedCopies || 0) +
        (inv.damagedCopies || 0) +
        (inv.lostCopies || 0);

      if (inv.totalCopies !== sum) allInvariantsValid = false;
      if (inv.availableCopies !== inv.totalCopies) allAvailableEqualTotal = false;
    }
    assert(allInvariantsValid, 'Mathematical invariant strictly verified across all inventory documents');
    assert(allAvailableEqualTotal, 'All books have 100% of copies available in library stock (issued = 0)');

    // 4. Clean Operational State Verification (Zero mock records)
    console.log('\n--- 4. Clean Operational State Verification ---');
    const studentCount = await User.countDocuments({ role: 'student' });
    assert(studentCount === 0, `Student accounts count: ${studentCount} (Clean state)`);

    const issueCount = await Issue.countDocuments();
    assert(issueCount === 0, `Circulation issue loans count: ${issueCount} (Clean state)`);

    const finePaymentCount = await FinePayment.countDocuments();
    assert(finePaymentCount === 0, `Fine payments count: ${finePaymentCount} (Clean state)`);

    const purchaseCount = await Purchase.countDocuments();
    assert(purchaseCount === 0, `Book purchases count: ${purchaseCount} (Clean state)`);

    const counter = await Counter.findOne({ name: 'libraryCard' });
    assert(counter && counter.sequenceValue === 0, `Library card counter initialized to 0 (Next student: 000000000001)`);

    // 5. Relational Integrity Checks
    console.log('\n--- 5. Foreign Key & Category Relationships ---');
    const books = await Book.find({});
    let allCategoriesExist = true;
    for (const b of books) {
      const cat = await Category.findById(b.category);
      if (!cat) allCategoriesExist = false;
    }
    assert(allCategoriesExist, 'All books reference valid Category documents');

    await mongoose.disconnect();

    console.log('\n===========================================================');
    console.log(`📊 Clean Database Verification: ${passed} Passed | ${failed} Failed`);
    console.log('===========================================================');
  } catch (err) {
    console.error('Verification error:', err.response?.data || err.message);
    failed++;
  }
};

runCleanSeederVerification();
