import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (user && user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: Admins only' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error checking admin status' });
  }
};