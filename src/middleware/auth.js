import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Token from '../models/Token.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['x-api-key'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }

  try {
    const dbToken = await Token.findOne({ where: { token, status: 'active' } });
    if (!dbToken) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    const user = await User.findOne({ where: { id: dbToken.userId, status: 'active' } });
    if (!user) {
      return res.status(403).json({ error: 'User not found or banned' });
    }
    
    if (user.quota <= 0) {
      return res.status(403).json({ error: 'Insufficient quota' });
    }

    req.user = user;
    req.token = dbToken;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
