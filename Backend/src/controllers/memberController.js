const User = require('../models/User');
const Issue = require('../models/Issue');

// @desc    Get all members (students)
// @route   GET /api/members
// @access  Private (Admin only)
const getMembers = async (req, res, next) => {
  try {
    const { search, isActive } = req.query;

    const query = { role: 'student' };

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { studentId: searchRegex },
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

// @desc    Update member details or deactivate account
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

// @desc    Delete member (Safe deletion)
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

    // Check if member has active borrowing records
    const activeBorrows = await Issue.countDocuments({
      student: member._id,
      status: { $in: ['issued', 'overdue'] },
    });

    if (activeBorrows > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete member with ${activeBorrows} active borrowed book(s). Please return all books or deactivate the member instead (isActive = false).`,
      });
    }

    await member.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Member deleted successfully',
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
  getMemberIssues,
};
