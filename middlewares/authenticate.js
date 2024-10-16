const jwt = require('jsonwebtoken');
require('dotenv').config(); // 환경 변수 설정

const authenticateToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  console.log('Auth Header:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Extracted Token:', token);

  if (!token) {
    console.log('No token provided');
    return res
      .status(401)
      .json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid token.' });
  }
};

module.exports = authenticateToken;
