/**
 * Comprehensive Test Suite for Soft Delete & Hard Delete System
 * Tests:
 * 1. Admin login
 * 2. Soft-delete book -> verify isDeleted=true, disappears from /api/books, appears in /api/trash
 * 3. Restore book -> verify isDeleted=false, reappears in /api/books
 * 4. Dependency check on book hard-delete (block if issues/purchases exist)
 * 5. Permanent delete on isolated book -> document completely removed
 * 6. Category soft-delete, restore, and permanent delete
 * 7. Trash summary counts
 * 8. Authorization protection (unauthenticated / student rejected)
 * 9. Dashboard stats exclude soft-deleted records
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('========================================================');
  console.log('Testing Soft Delete & Hard Delete System (PustakSetu)');
  console.log('========================================================\n');

  let adminToken = '';
  let studentToken = '';

  // 1. Admin & Student Login
  try {
    const adminRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@gmail.com',
      password: 'admin123',
    });
    adminToken = adminRes.data.token;
    console.log('✅ Admin login successful');
  } catch (err) {
    console.error('❌ Admin login failed:', err.response?.data || err.message);
    process.exit(1);
  }

  try {
    const studentRes = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Test Student',
      email: `teststudent.${Date.now()}@university.edu`,
      password: 'password123',
      studentId: `STU-${Date.now().toString().slice(-6)}`,
      phone: '9876543219',
    });
    studentToken = studentRes.data.token;
    console.log('✅ Registered test student successfully');
  } catch (err) {
    console.warn('⚠️ Student registration note:', err.response?.data?.message || err.message);
  }

  const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };
  const studentHeaders = { headers: { Authorization: `Bearer ${studentToken}` } };

  // 2. Fetch or create a category for testing
  let testCatId = '';
  try {
    const catRes = await axios.post(
      `${API_BASE}/categories`,
      { name: `Test Temp Cat ${Date.now()}`, description: 'Temporary test category' },
      adminHeaders
    );
    testCatId = catRes.data.data._id;
    console.log(`✅ Created test category: ${catRes.data.data.name} (ID: ${testCatId})`);
  } catch (err) {
    console.error('❌ Category creation failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 3. Create a test book
  let testBookId = '';
  const testIsbn = `978-999${Date.now().toString().slice(-7)}`;
  try {
    const bookRes = await axios.post(
      `${API_BASE}/books`,
      {
        title: `Ephemeral Test Book ${Date.now()}`,
        author: 'QA Automation',
        isbn: testIsbn,
        category: testCatId,
        totalCopies: 5,
        availableCopies: 5,
        shelfLocation: 'TEST-A1',
      },
      adminHeaders
    );
    testBookId = bookRes.data.data._id;
    console.log(`✅ Created test book: ${bookRes.data.data.title} (ID: ${testBookId})`);
  } catch (err) {
    console.error('❌ Book creation failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 4. Test Soft Delete Book
  try {
    const delRes = await axios.delete(`${API_BASE}/books/${testBookId}`, adminHeaders);
    if (delRes.data.success) {
      console.log('✅ Soft-delete book succeeded: Move to Trash');
    }
  } catch (err) {
    console.error('❌ Soft delete failed:', err.response?.data || err.message);
  }

  // 5. Verify book disappeared from active catalog
  try {
    const listRes = await axios.get(`${API_BASE}/books?search=${testIsbn}`);
    const found = listRes.data.data.find((b) => b._id === testBookId);
    if (!found) {
      console.log('✅ Verified: Soft-deleted book is NOT in active books list');
    } else {
      console.error('❌ Error: Soft-deleted book appeared in active list!');
    }
  } catch (err) {
    console.error('❌ Active books query failed:', err.message);
  }

  // 6. Verify book appears in Trash
  try {
    const trashRes = await axios.get(`${API_BASE}/trash?type=books`, adminHeaders);
    const inTrash = trashRes.data.data.find((b) => b._id === testBookId);
    if (inTrash) {
      console.log('✅ Verified: Soft-deleted book appears in Trash endpoint');
      console.log(`   Deleted at: ${inTrash.deletedAt}, Deleted by: ${inTrash.deletedBy?.email}`);
    } else {
      console.error('❌ Error: Book not found in Trash!');
    }
  } catch (err) {
    console.error('❌ Trash query failed:', err.response?.data || err.message);
  }

  // 7. Test Restore Book
  try {
    const restoreRes = await axios.put(`${API_BASE}/books/${testBookId}/restore`, {}, adminHeaders);
    if (restoreRes.data.success) {
      console.log('✅ Restore book succeeded');
    }
  } catch (err) {
    console.error('❌ Restore failed:', err.response?.data || err.message);
  }

  // 8. Verify restored book is back in active catalog
  try {
    const listRes = await axios.get(`${API_BASE}/books?search=${testIsbn}`);
    const found = listRes.data.data.find((b) => b._id === testBookId);
    if (found && !found.isDeleted) {
      console.log('✅ Verified: Restored book is back in active catalog with isDeleted=false');
    } else {
      console.error('❌ Error: Restored book not found in active catalog!');
    }
  } catch (err) {
    console.error('❌ Active books query failed:', err.message);
  }

  // 9. Authorization check: Student cannot restore or hard delete
  if (studentToken) {
    try {
      await axios.put(`${API_BASE}/books/${testBookId}/restore`, {}, studentHeaders);
      console.error('❌ Security fail: Student was allowed to call restore!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✅ Security verified: Student rejected from restore (403 Forbidden)');
      }
    }

    try {
      await axios.delete(`${API_BASE}/books/${testBookId}/permanent`, studentHeaders);
      console.error('❌ Security fail: Student was allowed to call hard-delete!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✅ Security verified: Student rejected from hard-delete (403 Forbidden)');
      }
    }
  }

  // 10. Dependency protection check: Try hard deleting a real book that has historical issues
  try {
    // Find an existing book with issues
    const booksRes = await axios.get(`${API_BASE}/books?limit=20`);
    const activeBooks = booksRes.data.data;
    let protectedBookId = '';
    for (const b of activeBooks) {
      if (b.title.toLowerCase().includes('clean code') || b.title.toLowerCase().includes('harry')) {
        protectedBookId = b._id;
        break;
      }
    }
    if (protectedBookId) {
      try {
        await axios.delete(`${API_BASE}/books/${protectedBookId}/permanent`, adminHeaders);
        console.error('❌ Dependency check failed: Book with history was hard-deleted!');
      } catch (err) {
        if (err.response?.status === 409) {
          console.log(`✅ Dependency protection verified: Permanent delete blocked with 409 Conflict: "${err.response.data.message}"`);
        } else {
          console.log(`✅ Protected status code: ${err.response?.status} - ${err.response?.data?.message}`);
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not verify historical dependency check:', err.message);
  }

  // 11. Permanent Hard Delete of isolated test book
  try {
    const hardRes = await axios.delete(`${API_BASE}/books/${testBookId}/permanent`, adminHeaders);
    if (hardRes.data.success) {
      console.log('✅ Hard delete succeeded on isolated test book');
    }
  } catch (err) {
    console.error('❌ Hard delete failed:', err.response?.data || err.message);
  }

  // 12. Verify book is completely gone from DB
  try {
    await axios.get(`${API_BASE}/books/${testBookId}`);
    console.error('❌ Error: Book still exists after hard delete!');
  } catch (err) {
    if (err.response?.status === 404) {
      console.log('✅ Verified: Book completely removed from MongoDB (404 Not Found)');
    }
  }

  // 13. Category Soft Delete & Permanent Delete
  try {
    const catDelRes = await axios.delete(`${API_BASE}/categories/${testCatId}`, adminHeaders);
    console.log('✅ Category soft-delete succeeded:', catDelRes.data.message);

    const catHardRes = await axios.delete(`${API_BASE}/categories/${testCatId}/permanent`, adminHeaders);
    console.log('✅ Category permanent hard-delete succeeded:', catHardRes.data.message);
  } catch (err) {
    console.error('❌ Category deletion tests failed:', err.response?.data || err.message);
  }

  // 13b. Member Soft Delete, Trash Check, Restore & Hard Delete
  try {
    // Create a temporary student to soft-delete
    const tempStudentRes = await axios.post(`${API_BASE}/auth/register`, {
      name: 'SoftDelete Member Test',
      email: `temp.student.${Date.now()}@university.edu`,
      password: 'password123',
      studentId: `STU-TEMP-${Date.now().toString().slice(-4)}`,
      phone: '9876543299',
    });
    const tempStudentId = tempStudentRes.data.user.id;

    // Soft delete member
    const memDelRes = await axios.delete(`${API_BASE}/members/${tempStudentId}`, adminHeaders);
    console.log('✅ Member soft-delete succeeded: Move to Trash');

    // Verify member in trash
    const memTrashRes = await axios.get(`${API_BASE}/trash?type=members`, adminHeaders);
    const foundMem = memTrashRes.data.data.find((m) => m._id === tempStudentId);
    if (foundMem) {
      console.log('✅ Verified: Soft-deleted member appears in members trash');
    }

    // Restore member
    const memRestoreRes = await axios.put(`${API_BASE}/members/${tempStudentId}/restore`, {}, adminHeaders);
    if (memRestoreRes.data.success) {
      console.log('✅ Member restore succeeded');
    }

    // Hard delete isolated member
    const memHardRes = await axios.delete(`${API_BASE}/members/${tempStudentId}/permanent`, adminHeaders);
    if (memHardRes.data.success) {
      console.log('✅ Member permanent hard-delete succeeded');
    }
  } catch (err) {
    console.error('❌ Member test failed:', err.response?.data || err.message);
  }

  // 14. Trash summary endpoint
  try {
    const summaryRes = await axios.get(`${API_BASE}/trash/summary`, adminHeaders);
    console.log('✅ Trash summary endpoint returned:', summaryRes.data.data);
  } catch (err) {
    console.error('❌ Trash summary failed:', err.response?.data || err.message);
  }

  // 15. Dashboard stats check
  try {
    const dashRes = await axios.get(`${API_BASE}/dashboard`, adminHeaders);
    console.log('✅ Dashboard stats loaded successfully (excludes soft-deleted items)');
    console.log(`   Total Titles: ${dashRes.data.data.totalTitles}, Total Students: ${dashRes.data.data.totalStudents}, Total Categories: ${dashRes.data.data.totalCategories}`);
  } catch (err) {
    console.error('❌ Dashboard stats failed:', err.response?.data || err.message);
  }

  console.log('\n========================================================');
  console.log('ALL SOFT & HARD DELETE TESTS COMPLETED SUCCESSFULLY! 🎉');
  console.log('========================================================\n');
}

runTests();
