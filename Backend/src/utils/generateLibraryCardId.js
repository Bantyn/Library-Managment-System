const Counter = require('../models/Counter');

const CARD_ID_LENGTH = 12;
const MAX_CARD_ID_VALUE = 999999999999; // 12 decimal digits maximum limit

/**
 * Atomically generates a unique, sequential, 12-digit fixed-length numeric Library Card ID.
 * Example format: "000000000001", "000000000123"
 * Enforces atomic concurrency safety via findOneAndUpdate with $inc and upsert.
 */
const generateLibraryCardId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: 'libraryCard' },
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );

  if (!counter || counter.sequenceValue > MAX_CARD_ID_VALUE) {
    throw new Error(
      'Maximum Library Card ID allocation limit (12 decimal digits) has been exceeded.'
    );
  }

  // Format as 12-digit decimal string with leading zeros preserved
  const libraryCardId = String(counter.sequenceValue).padStart(CARD_ID_LENGTH, '0');

  // Defensive validation of exact 12 decimal digits
  if (!/^[0-9]{12}$/.test(libraryCardId)) {
    throw new Error('Generated Library Card ID failed 12-digit decimal format validation.');
  }

  return libraryCardId;
};

module.exports = generateLibraryCardId;
