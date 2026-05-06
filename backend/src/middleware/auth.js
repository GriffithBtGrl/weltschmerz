const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

const requireAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new AppError('Authentication required', 401);
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    next(err);
  }
};

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {}
  }
  next();
};

module.exports = { requireAuth, optionalAuth };