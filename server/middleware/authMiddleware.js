const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/helpers');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json(errorResponse('User not found', 401));
      }

      return next();
    } catch (error) {
      return res.status(401).json(errorResponse('Not authorized', 401));
    }
  } else {
    return res.status(401).json(errorResponse('No token provided', 401));
  }
};

module.exports = { protect };
