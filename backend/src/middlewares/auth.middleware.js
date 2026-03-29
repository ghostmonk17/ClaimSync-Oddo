const jwtUtil = require('../utils/jwt.util');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Token missing.' });
    }

    const token = authHeader.split(' ')[1];


    const decoded = jwtUtil.verifyToken(token);
    
    // Attach decoded user struct natively resolving globally
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Token invalid or expired.' });
  }
};

module.exports = authMiddleware;
