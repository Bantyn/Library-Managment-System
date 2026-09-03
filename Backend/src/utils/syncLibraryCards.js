const User = require('../models/User');
const generateLibraryCardId = require('./generateLibraryCardId');

/**
 * Startup synchronization: ensures every existing student in MongoDB has a unique, sequential 12-digit Library Card ID.
 */
const syncExistingLibraryCards = async () => {
  try {
    const studentsWithoutCard = await User.find({
      role: 'student',
      $or: [
        { libraryCardId: { $exists: false } },
        { libraryCardId: null },
        { libraryCardId: '' },
      ],
    }).sort({ createdAt: 1 });

    if (studentsWithoutCard.length > 0) {
      console.log(`[LibraryCard] Found ${studentsWithoutCard.length} student(s) requiring Library Card ID assignment.`);
      for (const student of studentsWithoutCard) {
        const cardId = await generateLibraryCardId();
        student.libraryCardId = cardId;
        await student.save({ validateModifiedOnly: true });
        console.log(`[LibraryCard] Assigned ID ${cardId} to student ${student.name} (${student.email}).`);
      }
    }
  } catch (err) {
    console.error('[LibraryCard] Error during existing students card synchronization:', err.message);
  }
};

module.exports = syncExistingLibraryCards;
