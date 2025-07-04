import express from 'express';
import crypto from 'crypto';
import Token from '../models/Token.js';
import { authenticateJwt } from '../middleware/jwtAuth.js';

const router = express.Router();

// Generate a new token
router.post('/', authenticateJwt, async (req, res) => {
  try {
    const newToken = crypto.randomBytes(16).toString('hex');
    const token = await Token.create({
      token: `sk-${newToken}`,
      userId: req.user.id,
    });
    res.status(201).json(token);
  } catch (error) {
    res.status(500).json({ error: 'Error generating token' });
  }
});

// Get all tokens for the user
router.get('/', authenticateJwt, async (req, res) => {
  try {
    const tokens = await Token.findAll({ where: { userId: req.user.id } });
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching tokens' });
  }
});

// Delete a token
router.delete('/:id', authenticateJwt, async (req, res) => {
  try {
    const token = await Token.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    await token.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting token' });
  }
});

export default router;