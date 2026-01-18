import express from 'express';
import { getFinancialTips } from '../controllers/insightsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/tips', protect, getFinancialTips);

export default router;
