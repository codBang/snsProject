const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).send('Access denied. No token provided.');

  jwt.verify(token, process.env.JWT_SECRET || 'secretKey', (err, user) => {
    if (err) return res.status(403).send('Invalid token.');
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
