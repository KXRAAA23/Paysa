import Group from '../models/Group.js';
import Activity from '../models/Activity.js';
import mongoose from 'mongoose';

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
    let { groupId, title, totalAmount, paidBy, splits, category } = req.body;

    // Default category if missing
    if (!category) category = "General";

    // Parse splits if it's a string (FormData sends arrays as strings)
    if (typeof splits === 'string') {
        try {
            splits = JSON.parse(splits);
        } catch (error) {
            res.status(400).json({ message: 'Invalid splits format' });
            return;
        }
    }

    // Parse totalAmount if string
    if (typeof totalAmount === 'string') {
        totalAmount = parseFloat(totalAmount);
    }

    // Validation
    if (!groupId || !title || !totalAmount || !splits || splits.length === 0) {
        res.status(400).json({ message: 'Please provide all expense details' });
        return;
    }

    // Handle File Upload
    let billUrl = '';
    if (req.file) {
        billUrl = req.file.path.replace(/\\/g, "/"); // normalize path
    }

    // Validate Splits Sum
    const splitTotal = splits.reduce((acc, curr) => acc + curr.amount, 0);
    if (Math.abs(splitTotal - totalAmount) > 0.01) { // Floating point tolerance
        res.status(400).json({ message: `Split amounts (${splitTotal}) do not match total amount (${totalAmount})` });
        return;
    }

    // Verify Group
    const group = await Group.findById(groupId);
    if (!group) {
        res.status(404).json({ message: 'Group not found' });
        return;
    }

    // Check membership of creator
    const isMember = group.members.some(m => m.user?.toString() === req.user._id.toString());
    if (!isMember) {
        res.status(401).json({ message: 'Not authorized' });
        return;
    }

    // Validate All Split Users are Members
    const groupMemberIds = group.members.map(m => m.user?.toString());
    const invalidMembers = splits.filter(s => !groupMemberIds.includes(s.user.toString()));

    if (invalidMembers.length > 0) {
        res.status(400).json({ message: 'One or more split users are not members of this group' });
        return;
    }

    // Create Expense Object (Embedded)
    const newExpense = {
        _id: new mongoose.Types.ObjectId(), // Manually generate ID for easier reference
        title,
        totalAmount,
        category,
        paidBy: paidBy || req.user._id,
        splits,
        billUrl,
        createdAt: new Date()
    };

    group.expenses.push(newExpense);
    await group.save();

    // Log Activity
    await Activity.create({
        user: req.user._id,
        type: 'CREATE_EXPENSE',
        description: `You added "${title}" (₹${totalAmount}) to "${group.name}"`,
        metadata: { groupId: group._id, groupName: group.name }
    });

    // Return the new expense subdocument (matching previous response structure roughly)
    // We append groupId to it for convenience if frontend relied on it
    const createdExpense = { ...newExpense, groupId: group._id };
    res.status(201).json(createdExpense);
};

// @desc    Get expenses by group
// @route   GET /api/expenses/group/:groupId
// @access  Private
const getGroupExpenses = async (req, res) => {
    const group = await Group.findById(req.params.groupId)
        .populate('expenses.paidBy', 'name email avatar')
        .populate('expenses.splits.user', 'name email avatar');

    if (!group) {
        res.status(404).json({ message: 'Group not found' });
        return;
    }

    // Sort in memory or use aggregation if array is large (for now memory sort is fine)
    const expenses = group.expenses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(expenses);
};

// @desc    Get single expense by ID
// @route   GET /api/expenses/:expenseId
// @access  Private
const getExpenseById = async (req, res) => {
    const group = await Group.findOne({ 'expenses._id': req.params.expenseId })
        .populate('expenses.paidBy', 'name email avatar')
        .populate('expenses.splits.user', 'name email avatar');

    if (!group) {
        res.status(404).json({ message: 'Expense not found' });
        return;
    }

    // Check membership (optional but recommended for security)
    const isMember = group.members.some(m => m.user?.toString() === req.user._id.toString());
    if (!isMember) {
        res.status(401).json({ message: 'Not authorized' });
        return;
    }

    const expense = group.expenses.id(req.params.expenseId);
    res.json(expense);
};

// @desc    Settle an expense split
// @route   PATCH /api/expenses/:expenseId/settle
// @access  Private
const settleExpenseSplit = async (req, res) => {
    // Need groupId to find the expense efficiently, or search all groups.
    // Ideally user sends groupId. If not, we scan (inefficient).
    // Let's first try to find the group containing this expense.
    // Optimized: assume groupId is passed in body for now, or use 'elemMatch'

    let group;
    if (req.body.groupId) {
        group = await Group.findById(req.body.groupId);
    } else {
        // Find group where expenses._id == expenseId
        group = await Group.findOne({ 'expenses._id': req.params.expenseId });
    }

    if (!group) {
        res.status(404).json({ message: 'Group (or Expense) not found' });
        return;
    }

    const expense = group.expenses.id(req.params.expenseId);
    if (!expense) {
        res.status(404).json({ message: 'Expense not found in group' });
        return;
    }

    const targetUserId = req.body.userId || req.user._id;

    const split = expense.splits.find(s => s.user.toString() === targetUserId.toString());
    if (split) {
        split.settled = true;
        await group.save(); // Save the parent document
        res.json(expense);
    } else {
        res.status(404).json({ message: 'Split not found for user' });
    }
};

// @desc    Get user balance summary
// @route   GET /api/expenses/balance
// @access  Private
const getUserBalance = async (req, res) => {
    const userId = req.user._id;
    const userIdObj = new mongoose.Types.ObjectId(userId);

    // Aggregation to unwind expenses and filter relevant ones
    const expenses = await Group.aggregate([
        { $match: { 'members.user': userIdObj } }, // Optimization: match groups user is part of
        { $unwind: '$expenses' },
        {
            $match: {
                $or: [
                    { 'expenses.paidBy': userIdObj },
                    { 'expenses.splits.user': userIdObj }
                ]
            }
        },
        {
            $project: {
                paidBy: '$expenses.paidBy',
                totalAmount: '$expenses.totalAmount',
                splits: '$expenses.splits'
            }
        }
    ]);

    let totalBalance = 0;
    let pendingSettlements = 0;

    expenses.forEach(expense => {
        const isPayer = expense.paidBy.toString() === userId.toString();

        if (isPayer) {
            // I paid. Calculate what others owe me (unsettled splits).
            expense.splits.forEach(split => {
                if (split.user.toString() !== userId.toString()) {
                    if (!split.settled) {
                        totalBalance += split.amount; // Others owe me
                    }
                }
            });
        } else {
            // Someone else paid. Check if I owe them.
            const mySplit = expense.splits.find(s => s.user.toString() === userId.toString());
            if (mySplit) {
                if (!mySplit.settled) {
                    totalBalance -= mySplit.amount; // I owe
                    pendingSettlements++;
                }
            }
        }
    });

    res.json({
        totalBalance: parseFloat(totalBalance.toFixed(2)), // Ensure 2 decimal places
        pendingSettlements,
        activeGroups: 0 // Optional
    });
};

export { createExpense, getGroupExpenses, getExpenseById, settleExpenseSplit, getUserBalance };
