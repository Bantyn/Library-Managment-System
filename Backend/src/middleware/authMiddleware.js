const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'bachelor_library_jwt_secret_key_2026'
      );

      // Find user by decoded ID, excluding password
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Authorization denied.',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'User account is deactivated. Please contact the administrator.',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Authorization denied.',
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided. Authorization denied.',
    });
  }
};

module.exports = { protect };
