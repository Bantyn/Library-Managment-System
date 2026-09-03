const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const generateLibraryCardId = require('../utils/generateLibraryCardId');
const captchaService = require('../services/captchaService');

const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// @desc    Generate a fresh visual SVG CAPTCHA challenge
// @route   GET /api/auth/captcha
// @access  Public
const getCaptcha = async (req, res) => {
    const challenge = captchaService.createCaptcha();
    res.status(200).json({
        success: true,
        captchaId: challenge.captchaId,
        captchaSvg: challenge.svg,
    });
};

// @desc    Register a new student member
// @route   POST /api/auth/register
// @access  Public (Students only)
const register = async (req, res, next) => {
    try {
        const { name, email, password, studentId, phone, captchaId, captchaAnswer } = req.body;

        // CAPTCHA verification (required if captchaId is provided or during production verification)
        if (captchaId) {
            const isCaptchaValid = captchaService.verifyCaptcha(captchaId, captchaAnswer);
            if (!isCaptchaValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired security CAPTCHA. Please enter the characters shown in the image.',
                });
            }
        }

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

        // Atomically generate unique 12-digit sequential Library Card / Pass ID
        const libraryCardId = await generateLibraryCardId();

        // Enforce role: 'student' - public registration can NEVER create admin
        const user = new User({
            name,
            email,
            password,
            role: 'student',
            studentId,
            libraryCardId,
            phone,
            isActive: true,
        });

        await user.save();

        const token = generateToken(user._id, user.role);

        // Issue secure HTTP-Only session cookie
        res.cookie('token', token, getCookieOptions());

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
                libraryCardId: user.libraryCardId,
                phone: user.phone,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Authenticate user & get token with cookie
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { email, password, captchaId, captchaAnswer } = req.body;

        // CAPTCHA verification (enforced if captchaId provided)
        if (captchaId) {
            const isCaptchaValid = captchaService.verifyCaptcha(captchaId, captchaAnswer);
            if (!isCaptchaValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired security CAPTCHA. Please enter the characters shown in the image.',
                });
            }
        }

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.',
            });
        }

        // Find user by email
        const user = await User.findOne({ email });


        // Email does not exist
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with this email.',
            });
        }


        // Check password
        const isMatch = await user.comparePassword(password);


        // Password is incorrect
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect password. Please try again.',
            });
        }


        // Check account status
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact the administrator.',
            });
        }
        const token = generateToken(user._id, user.role);

        // Issue secure HTTP-Only session cookie
        res.cookie('token', token, getCookieOptions());

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
                libraryCardId: user.libraryCardId,
                phone: user.phone,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Clear session cookie & log user out
// @route   POST /api/auth/logout
// @access  Public
const logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    });
    res.status(200).json({
        success: true,
        message: 'Session cleared. Logged out successfully.',
    });
};

// @desc    Get current logged in user profile (supports cookie or Bearer header)
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
    getCaptcha,
    register,
    login,
    logout,
    getMe,
};
