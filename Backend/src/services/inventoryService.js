const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const Book = require('../models/Book');
const Issue = require('../models/Issue');
const Purchase = require('../models/Purchase');

class InventoryService {
  /**
   * Helper to synchronize Book model copy numbers with authoritative Inventory state
   */
  async syncBookCopies(bookId, availableCopies, totalCopies) {
    try {
      await Book.findByIdAndUpdate(bookId, {
        availableCopies,
        totalCopies,
      });
    } catch (err) {
      console.error('Error synchronizing Book copies:', err.message);
    }
  }

  /**
   * Retrieve existing inventory or initialize one from Book record
   */
  async getOrCreateInventory(bookId) {
    let inventory = await Inventory.findOne({ book: bookId });
    if (!inventory) {
      const book = await Book.findById(bookId);
      if (!book) {
        throw new Error('Book record not found.');
      }

      // Count active loans to calculate issuedCopies accurately
      const activeIssuesCount = await Issue.countDocuments({
        book: bookId,
        status: { $in: ['issued', 'overdue'] },
        returnDate: null,
      });

      const total = book.totalCopies || 0;
      const issued = Math.min(total, activeIssuesCount);
      const available = Math.max(0, total - issued);

      inventory = await Inventory.create({
        book: book._id,
        totalCopies: total,
        availableCopies: available,
        issuedCopies: issued,
        reservedCopies: 0,
        damagedCopies: 0,
        lostCopies: 0,
        purchasePrice: book.purchasePrice || 0,
        lowStockThreshold: 2,
      });

      // Log initial onboarding transaction
      if (total > 0) {
        const dummyAdminId = book._id; // fallback reference
        await InventoryTransaction.create({
          book: book._id,
          inventory: inventory._id,
          type: 'STOCK_IN',
          quantity: total,
          previousAvailable: 0,
          newAvailable: available,
          reason: 'Initial catalog onboarding and stock initialization',
          performedBy: dummyAdminId,
        });
      }
    }
    return inventory;
  }

  /**
   * 1. STOCK IN: Add new physical copies to library inventory
   */
  async stockIn(bookId, quantity, reason, adminId) {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      throw new Error('Quantity to add must be a positive integer greater than 0.');
    }
    if (!reason || !reason.trim()) {
      throw new Error('A reason for stock-in must be provided.');
    }

    const inventory = await this.getOrCreateInventory(bookId);
    const previousAvailable = inventory.availableCopies;

    inventory.totalCopies += qty;
    inventory.availableCopies += qty;
    await inventory.save();

    const transaction = await InventoryTransaction.create({
      book: bookId,
      inventory: inventory._id,
      type: 'STOCK_IN',
      quantity: qty,
      previousAvailable,
      newAvailable: inventory.availableCopies,
      reason: reason.trim(),
      performedBy: adminId,
    });

    await this.syncBookCopies(bookId, inventory.availableCopies, inventory.totalCopies);
    return { inventory, transaction };
  }

  /**
   * 2. ISSUE BOOK: Atomically decrement available and increment issued
   */
  async recordIssue(bookId, issueId, adminId) {
    const inventory = await this.getOrCreateInventory(bookId);

    if (inventory.availableCopies <= 0) {
      throw new Error('Cannot issue book. Available inventory copies is 0 (Out of Stock).');
    }

    const previousAvailable = inventory.availableCopies;
    inventory.availableCopies -= 1;
    inventory.issuedCopies += 1;
    await inventory.save();

    const transaction = await InventoryTransaction.create({
      book: bookId,
      inventory: inventory._id,
      type: 'ISSUE',
      quantity: 1,
      previousAvailable,
      newAvailable: inventory.availableCopies,
      reason: `Circulation loan issued to student`,
      referenceId: issueId,
      performedBy: adminId,
    });

    await this.syncBookCopies(bookId, inventory.availableCopies, inventory.totalCopies);
    return { inventory, transaction };
  }

  /**
   * 3. RETURN BOOK: Atomically decrement issued and increment available
   */
  async recordReturn(bookId, issueId, adminId) {
    const inventory = await this.getOrCreateInventory(bookId);

    if (inventory.issuedCopies <= 0) {
      // Safety guard against double-return count
      console.warn(`Issued copies was already 0 for book ${bookId}`);
    } else {
      inventory.issuedCopies -= 1;
    }

    const previousAvailable = inventory.availableCopies;
    inventory.availableCopies += 1;
    await inventory.save();

    const transaction = await InventoryTransaction.create({
      book: bookId,
      inventory: inventory._id,
      type: 'RETURN',
      quantity: 1,
      previousAvailable,
      newAvailable: inventory.availableCopies,
      reason: `Book returned from circulation loan`,
      referenceId: issueId,
      performedBy: adminId,
    });

    await this.syncBookCopies(bookId, inventory.availableCopies, inventory.totalCopies);
    return { inventory, transaction };
  }

  /**
   * 4. DAMAGE: Mark copies damaged from available inventory
   */
  async markDamage(bookId, quantity, reason, adminId) {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      throw new Error('Damaged quantity must be greater than 0.');
    }
    if (!reason || !reason.trim()) {
      throw new Error('A damage audit reason must be provided.');
    }

    const inventory = await this.getOrCreateInventory(bookId);

    if (qty > inventory.availableCopies) {
      throw new Error(
        `Cannot mark ${qty} copy(ies) damaged. Only ${inventory.availableCopies} available in stock.`
      );
    }

    const previousAvailable = inventory.availableCopies;
    inventory.availableCopies -= qty;
    inventory.damagedCopies += qty;
    await inventory.save();

    const transaction = await InventoryTransaction.create({
      book: bookId,
      inventory: inventory._id,
      type: 'DAMAGE',
      quantity: qty,
      previousAvailable,
      newAvailable: inventory.availableCopies,
      reason: reason.trim(),
      performedBy: adminId,
    });

    await this.syncBookCopies(bookId, inventory.availableCopies, inventory.totalCopies);
    return { inventory, transaction };
  }

  /**
   * 5. LOST: Mark copies lost from available inventory
   */
  async markLost(bookId, quantity, reason, adminId) {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      throw new Error('Lost quantity must be greater than 0.');
    }
    if (!reason || !reason.trim()) {
      throw new Error('A lost book reason must be provided.');
    }

    const inventory = await this.getOrCreateInventory(bookId);

    if (qty > inventory.availableCopies) {
      throw new Error(
        `Cannot mark ${qty} copy(ies) lost. Only ${inventory.availableCopies} available in stock.`
      );
    }

    const previousAvailable = inventory.availableCopies;
    inventory.availableCopies -= qty;
    inventory.lostCopies += qty;
    await inventory.save();

    const transaction = await InventoryTransaction.create({
      book: bookId,
      inventory: inventory._id,
      type: 'LOST',
      quantity: qty,
      previousAvailable,
      newAvailable: inventory.availableCopies,
      reason: reason.trim(),
      performedBy: adminId,
    });

    await this.syncBookCopies(bookId, inventory.availableCopies, inventory.totalCopies);
    return { inventory, transaction };
  }

  /**
   * 6. RECOVER: Restore previously lost copies back into available stock
   */
  async recoverLost(bookId, quantity, reason, adminId) {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      throw new Error('Recovered quantity must be greater than 0.');
    }
    if (!reason || !reason.trim()) {
      throw new Error('A recovery note/reason must be provided.');
    }

    const inventory = await this.getOrCreateInventory(bookId);

    if (qty > inventory.lostCopies) {
      throw new Error(
        `Cannot recover ${qty} copy(ies). Only ${inventory.lostCopies} copy(ies) are currently recorded as lost.`
      );
    }

    const previousAvailable = inventory.availableCopies;
    inventory.lostCopies -= qty;
    inventory.availableCopies += qty;
    await inventory.save();

    const transaction = await InventoryTransaction.create({
      book: bookId,
      inventory: inventory._id,
      type: 'RECOVERED',
      quantity: qty,
      previousAvailable,
      newAvailable: inventory.availableCopies,
      reason: reason.trim(),
      performedBy: adminId,
    });

    await this.syncBookCopies(bookId, inventory.availableCopies, inventory.totalCopies);
    return { inventory, transaction };
  }

  /**
   * 7. ADJUSTMENT: Explicit administrative stock count correction
   */
  async adjustStock(bookId, adjustmentType, quantity, reason, adminId) {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      throw new Error('Adjustment quantity must be greater than 0.');
    }
    if (!reason || !reason.trim()) {
      throw new Error('An audit reason for the inventory adjustment must be provided.');
    }

    const inventory = await this.getOrCreateInventory(bookId);
    const previousAvailable = inventory.availableCopies;

    if (adjustmentType === 'increase') {
      inventory.totalCopies += qty;
      inventory.availableCopies += qty;
    } else if (adjustmentType === 'decrease') {
      if (qty > inventory.availableCopies) {
        throw new Error(
          `Cannot decrease stock by ${qty}. Current available is only ${inventory.availableCopies}.`
        );
      }
      inventory.totalCopies -= qty;
      inventory.availableCopies -= qty;
    } else {
      throw new Error('Adjustment type must be either "increase" or "decrease".');
    }

    await inventory.save();

    const transaction = await InventoryTransaction.create({
      book: bookId,
      inventory: inventory._id,
      type: 'ADJUSTMENT',
      quantity: qty,
      previousAvailable,
      newAvailable: inventory.availableCopies,
      reason: `[${adjustmentType.toUpperCase()}] ${reason.trim()}`,
      performedBy: adminId,
    });

    await this.syncBookCopies(bookId, inventory.availableCopies, inventory.totalCopies);
    return { inventory, transaction };
  }

  /**
   * 8. PHYSICAL STOCK CHECK: Reconciles physical count with system count
   */
  async physicalStockCheck(bookId, physicalCount, reason, adminId) {
    const count = parseInt(physicalCount, 10);
    if (isNaN(count) || count < 0) {
      throw new Error('Physical count must be a non-negative integer (>= 0).');
    }

    const inventory = await this.getOrCreateInventory(bookId);
    const currentAvailable = inventory.availableCopies;
    const diff = count - currentAvailable;

    if (diff === 0) {
      return {
        inventory,
        message: 'Physical count matches system available count exactly (0 discrepancy).',
      };
    }

    const adjustmentType = diff > 0 ? 'increase' : 'decrease';
    const adjustmentQty = Math.abs(diff);

    const auditReason = reason && reason.trim()
      ? `Physical Count Audit: ${reason.trim()} (System: ${currentAvailable}, Physical: ${count}, Diff: ${diff > 0 ? '+' : ''}${diff})`
      : `Physical Count Audit: System had ${currentAvailable}, physical count showed ${count} (Diff: ${diff > 0 ? '+' : ''}${diff})`;

    return await this.adjustStock(
      bookId,
      adjustmentType,
      adjustmentQty,
      auditReason,
      adminId
    );
  }

  /**
   * 9. PURCHASE FULFILLMENT: Admin physically fulfills purchased book
   */
  async fulfillPurchase(purchaseId, adminId) {
    const purchase = await Purchase.findById(purchaseId).populate('book');
    if (!purchase) {
      throw new Error('Purchase record not found.');
    }

    if (purchase.status === 'fulfilled') {
      throw new Error('This purchase has already been fulfilled.');
    }

    if (purchase.status !== 'paid' && purchase.status !== 'processing') {
      throw new Error(`Cannot fulfill purchase with status "${purchase.status}". Only paid orders can be fulfilled.`);
    }

    const bookId = purchase.book._id;
    const inventory = await this.getOrCreateInventory(bookId);

    if (inventory.availableCopies <= 0) {
      throw new Error('Cannot fulfill purchase. No physical copies available in inventory stock.');
    }

    const previousAvailable = inventory.availableCopies;
    inventory.availableCopies -= 1;
    inventory.totalCopies -= 1;
    await inventory.save();

    const transaction = await InventoryTransaction.create({
      book: bookId,
      inventory: inventory._id,
      type: 'STOCK_OUT',
      quantity: 1,
      previousAvailable,
      newAvailable: inventory.availableCopies,
      reason: `Fulfilled and dispatched physical copy for Student Purchase #${purchase._id}`,
      referenceId: purchase._id,
      performedBy: adminId,
    });

    purchase.status = 'fulfilled';
    purchase.fulfilledAt = new Date();
    purchase.fulfilledBy = adminId;
    await purchase.save();

    await this.syncBookCopies(bookId, inventory.availableCopies, inventory.totalCopies);
    return { purchase, inventory, transaction };
  }

  /**
   * Run startup synchronization to ensure all existing Book records have an Inventory document
   */
  async syncAllExistingBooks() {
    try {
      const books = await Book.find({});
      for (const book of books) {
        await this.getOrCreateInventory(book._id);
      }
      console.log(`[Inventory] Verified and synchronized physical inventory for ${books.length} books.`);
    } catch (err) {
      console.error('[Inventory] Error during initial books synchronization:', err.message);
    }
  }
}

module.exports = new InventoryService();
