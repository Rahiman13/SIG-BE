const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// exports.protect = async (req, res, next) => {
//   let token;

//   // Check if token exists in headers
//   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//     try {
//       // Get token from header
//       token = req.headers.authorization.split(' ')[1];

//       // Verify the token
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);

//       // Get user from the token (assumed user id is decoded)
//       req.employee = await Employee.findById(decoded.id).select('-password'); // Avoid returning the password

//       next();
//     } catch (error) {
//       res.status(401).json({ message: 'Not authorized, token failed' });
//     }
//   }

//   if (!token) {
//     res.status(401).json({ message: 'Not authorized, no token' });
//   }
// };

// middleware/adminMiddleware.js

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employee = await Employee.findById(decoded.id).select('-password');

    if (!employee) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = employee; // ✅ this is what your controller expects

    next();
  } catch (err) {
    res.status(401).json({ message: 'Token verification failed' });
  }
};

exports.adminOnly = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Employee.findById(decoded.id);

    if (!user || (user.role !== 'HR' && user.role !== 'CEO')) {
      return res.status(403).json({ message: 'Admins only' });
    }

    req.user = user; // Attach user to request
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};