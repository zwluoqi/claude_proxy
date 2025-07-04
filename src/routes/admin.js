import express from 'express';
import User from '../models/User.js';
import Token from '../models/Token.js';
import RedemptionCode from '../models/RedemptionCode.js';
import { authenticateJwt } from '../middleware/jwtAuth.js';
import { isAdmin } from '../middleware/adminAuth.js';
import ModelPrice from '../models/ModelPrice.js';
import crypto from 'crypto';

const router = express.Router();

// Get all users
router.get('/users', authenticateJwt, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({ include: Token });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Ban/unban a user
router.put('/users/:id/status', authenticateJwt, isAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['active', 'banned'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.status = status;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error updating user status' });
  }
});

// Ban/unban a token
router.put('/tokens/:id/status', authenticateJwt, isAdmin, async (req, res) => {
    const { status } = req.body;
    if (!['active', 'banned'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
  
    try {
      const token = await Token.findByPk(req.params.id);
      if (!token) {
        return res.status(404).json({ error: 'Token not found' });
      }
      token.status = status;
      await token.save();
      res.json(token);
    } catch (error) {
      res.status(500).json({ error: 'Error updating token status' });
    }
  });

// Generate redemption codes
router.post('/redemption-codes', authenticateJwt, isAdmin, async (req, res) => {
  const { count, quota } = req.body;
  if (!count || !quota) {
    return res.status(400).json({ error: 'Count and quota are required' });
  }

  try {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(8).toString('hex');
      codes.push({ code, quota });
    }
    const createdCodes = await RedemptionCode.bulkCreate(codes);
    res.status(201).json(createdCodes);
  } catch (error) {
    res.status(500).json({ error: 'Error generating redemption codes' });
  }
});

// Configure model prices
router.post('/prices', authenticateJwt, isAdmin, async (req, res) => {
    const { modelName, inputPrice, outputPrice } = req.body;
    if (!modelName || !inputPrice || !outputPrice) {
      return res.status(400).json({ error: 'modelName, inputPrice, and outputPrice are required' });
    }
  
    try {
      const [price, created] = await ModelPrice.findOrCreate({
        where: { modelName },
        defaults: { inputPrice, outputPrice }
      });
  
      if (!created) {
        price.inputPrice = inputPrice;
        price.outputPrice = outputPrice;
        await price.save();
      }
  
      res.status(201).json(price);
    } catch (error) {
      res.status(500).json({ error: 'Error configuring model prices' });
    }
  });

export default router;