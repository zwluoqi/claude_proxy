import express from 'express';
import RedemptionCode from '../models/RedemptionCode.js';
import User from '../models/User.js';
import { authenticateJwt } from '../middleware/jwtAuth.js';

const router = express.Router();

router.post('/redeem', authenticateJwt, async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Redemption code is required' });
  }

  try {
    const redemptionCode = await RedemptionCode.findOne({ where: { code, isUsed: false } });
    if (!redemptionCode) {
      return res.status(404).json({ error: 'Invalid or used redemption code' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.quota += redemptionCode.quota;
    await user.save();

    redemptionCode.isUsed = true;
    await redemptionCode.save();

    res.json({ message: 'Quota redeemed successfully', newQuota: user.quota });
  } catch (error) {
    res.status(500).json({ error: 'Error redeeming code' });
  }
});

export default router;