const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new student member
// @route   POST /api/auth/register
// @access  Public (Students only)
const register = async (req, res, next) => {
  try {
    const { name, email, password, studentId, phone } = req.body;

    // Basic input validation
    if (!name || !email || !password || !studentId) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and studentId are required.',
      });
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists.',
      });
    }

    // Check if studentId is already used
    const existingStudentId = await User.findOne({ studentId });
    if (existingStudentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID already registered. Please use your unique Student ID.',
      });
    }

    // Enforce role: 'student' - public registration can NEVER create admin
    const user = new User({
      name,
      email,
      password,
      role: 'student',
      studentId,
      phone,
      isActive: true,
    });

    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact the administrator.',
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private (Student & Admin)
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
