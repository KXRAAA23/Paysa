import express from 'express';
import { createExpense, getGroupExpenses, getExpenseById, settleExpenseSplit, getUserBalance } from '../controllers/expenseController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/', protect, upload.single('bill'), createExpense);
router.get('/balance', protect, getUserBalance);
router.get('/group/:groupId', protect, getGroupExpenses);
router.get('/:expenseId', protect, getExpenseById);
router.patch('/:expenseId/settle', protect, settleExpenseSplit);

export default router;
