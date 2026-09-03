const User = require('../models/User');
const Issue = require('../models/Issue');
const Purchase = require('../models/Purchase');

// @desc    Get all members (students) with filter & search
// @route   GET /api/members
// @access  Private (Admin only)
const getMembers = async (req, res, next) => {
  try {
    const { search, isActive, libraryCardId } = req.query;

    // Always exclude soft-deleted members from normal list
    const query = { role: 'student', isDeleted: { $ne: true } };

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (libraryCardId && libraryCardId.trim()) {
      query.libraryCardId = libraryCardId.trim();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { studentId: searchRegex },
        { libraryCardId: searchRegex },
      ];
    }

    const members = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single member by ID with active issue summary
// @route   GET /api/members/:id
// @access  Private (Admin only)
const getMemberById = async (req, res, next) => {
  try {
    const member = await User.findById(req.params.id).select('-password');
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    const activeIssuesCount = await Issue.countDocuments({
      student: member._id,
      status: { $in: ['issued', 'overdue'] },
    });

    res.status(200).json({
      success: true,
      data: {
        ...member.toObject(),
        activeLoansCount: activeIssuesCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update member details (Enforces libraryCardId immutability)
// @route   PUT /api/members/:id
// @access  Private (Admin only)
const updateMember = async (req, res, next) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    // 1. Enforce strict immutability of libraryCardId
    if (
      req.body.libraryCardId &&
      member.libraryCardId &&
      req.body.libraryCardId !== member.libraryCardId
    ) {
      return res.status(400).json({
        success: false,
        message: 'Library Card / Pass ID is permanent and immutable. It cannot be altered.',
      });
    }

    const { name, phone, studentId, isActive } = req.body;

    if (name) member.name = name.trim();
    if (phone !== undefined) member.phone = phone.trim();

    if (studentId && studentId.trim() !== member.studentId) {
      const duplicateStudentId = await User.findOne({
        _id: { $ne: req.params.id },
        studentId: studentId.trim(),
      });
      if (duplicateStudentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is already assigned to another student.',
        });
      }
      member.studentId = studentId.trim();
    }

    if (isActive !== undefined) {
      member.isActive = Boolean(isActive);
    }

    await member.save();

    const updatedMember = await User.findById(member._id).select('-password');

    res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      data: updatedMember,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete member (Move to Trash)
// @route   DELETE /api/members/:id
// @access  Private (Admin only)
const deleteMember = async (req, res, next) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    if (member.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Member is already in trash.',
      });
    }

    // Block if active borrowings exist
    const activeBorrows = await Issue.countDocuments({
      student: member._id,
      status: { $in: ['issued', 'overdue'] },
    });

    if (activeBorrows > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot move to trash. Member has ${activeBorrows} active borrowed book(s). Please return all books first.`,
      });
    }

    // Soft delete — preserve libraryCardId so it is never reused
    member.isDeleted = true;
    member.isActive = false;
    member.deletedAt = new Date();
    member.deletedBy = req.user ? req.user._id : null;
    await member.save();

    res.status(200).json({
      success: true,
      message: 'Member moved to trash. Historical records and Library Card ID preserved.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore soft-deleted member from Trash
// @route   PUT /api/members/:id/restore
// @access  Private (Admin only)
const restoreMember = async (req, res, next) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    if (!member.isDeleted) {
      return res.status(400).json({ success: false, message: 'Member is not in trash.' });
    }

    member.isDeleted = false;
    member.isActive = true;
    member.deletedAt = null;
    member.deletedBy = null;
    await member.save();

    res.status(200).json({
      success: true,
      message: 'Member restored successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete member from database
// @route   DELETE /api/members/:id/permanent
// @access  Private (Admin only)
const hardDeleteMember = async (req, res, next) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Dependency checks
    const [activeIssues, historyIssues, purchases] = await Promise.all([
      Issue.countDocuments({ student: member._id, status: { $in: ['issued', 'overdue'] } }),
      Issue.countDocuments({ student: member._id }),
      Purchase.countDocuments({ student: member._id }),
    ]);

    if (activeIssues > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot permanently delete. Member has ${activeIssues} active issue(s). Return all books first.`,
      });
    }

    if (historyIssues > 0 || purchases > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot permanently delete. Member has historical records (${historyIssues} issue(s), ${purchases} purchase(s)). Preserving data integrity.`,
      });
    }

    await User.deleteOne({ _id: member._id });

    res.status(200).json({
      success: true,
      message: 'Member permanently deleted from database.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get borrowing history for a specific member
// @route   GET /api/members/:id/issues
// @access  Private (Admin or Member themselves)
const getMemberIssues = async (req, res, next) => {
  try {
    // If student, can only view their own issues
    if (req.user.role === 'student' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own borrowing records.',
      });
    }

    const issues = await Issue.find({ student: req.params.id })
      .populate('book', 'title author isbn publisher shelfLocation')
      .sort({ issueDate: -1 });

    res.status(200).json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
  restoreMember,
  hardDeleteMember,
  getMemberIssues,
};
