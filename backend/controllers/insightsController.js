import Group from '../models/Group.js';
import mongoose from 'mongoose';

// @desc    Get AI Financial Tips
// @route   GET /api/insights/tips
// @access  Private
const getFinancialTips = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch all groups user is part of
        const groups = await Group.find({ 'members.user': userId }).populate('expenses.splits.user');

        const tips = [];
        const userIdStr = userId.toString();

        // 1. Calculate Settlement Agility (Average days to settle)
        // This requires tracking when a split was created vs settled. 
        // Currently Expense model has 'createdAt', split has 'settled' (boolean).
        // We don't track 'settledAt' date in current schema.
        // Rule: If user has many UNSETTLED splits older than 7 days -> Warning.

        let pendingOldSplits = 0;
        let totalPendingAmount = 0;
        let totalTransactionCount = 0;
        let totalSpendAmount = 0;
        let recentTransactionCount = 0; // Last 30 days
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        // 2. Category Analysis
        const categorySpend = {};
        const allTransactions = [];

        groups.forEach(group => {
            if (!group.expenses) return;

            group.expenses.forEach(expense => {
                const mySplit = expense.splits.find(s => s.user && (s.user._id.toString() === userIdStr || s.user.toString() === userIdStr));

                if (mySplit) {
                    const amount = mySplit.amount;
                    totalTransactionCount++;
                    totalSpendAmount += amount;
                    allTransactions.push(amount);

                    // Category aggregation
                    const cat = expense.category || "General";
                    if (!categorySpend[cat]) categorySpend[cat] = 0;
                    categorySpend[cat] += amount;

                    // Recent Activity Check
                    if (new Date(expense.createdAt) > thirtyDaysAgo) {
                        recentTransactionCount++;
                    }

                    // Pending Settlements Check
                    // If I didn't pay (someone else paid), and I haven't settled
                    if (expense.paidBy && expense.paidBy.toString() !== userIdStr && !mySplit.settled) {
                        totalPendingAmount += amount;
                        if (new Date(expense.createdAt) < sevenDaysAgo) {
                            pendingOldSplits++;
                        }
                    }
                }
            });
        });

        // GENERATE TIPS

        // Tip 1: Pending Dues Warning
        if (pendingOldSplits > 0) {
            tips.push({
                id: 'settlement-lag',
                type: 'warning',
                title: 'Settlement Lag Detected',
                description: `You have ${pendingOldSplits} expenses pending for more than a week. Settle them soon to maintain good group standing!`,
                action: 'Settle Now'
            });
        }

        // Tip 2: Category Spending Insight
        const sortedCategories = Object.entries(categorySpend).sort((a, b) => b[1] - a[1]);
        if (sortedCategories.length > 0) {
            const topCat = sortedCategories[0];
            tips.push({
                id: 'top-spend',
                type: 'insight',
                title: `Spending Habit: ${topCat[0]}`,
                description: `You spend the most on ${topCat[0]} (₹${topCat[1].toFixed(0)} total). Consider creating a budget for this category.`,
            });
        }

        // Tip 3: Frequent Spender Alert
        if (recentTransactionCount > 15) {
            tips.push({
                id: 'high-frequency',
                type: 'insight',
                title: 'High Activity Month',
                description: `You've been involved in ${recentTransactionCount} transactions in the last 30 days. Keep an eye on the small expenses!`,
            });
        }

        // Tip 4: High Value Transaction Alert
        if (totalTransactionCount > 0) {
            const avgTransaction = totalSpendAmount / totalTransactionCount;
            // Check if there's any significantly large transaction (e.g., > 3x average)
            const highValueTx = allTransactions.find(amount => amount > avgTransaction * 3);
            if (highValueTx) {
                tips.push({
                    id: 'high-value',
                    type: 'warning',
                    title: 'Big Ticket Expense',
                    description: `We noticed a large share of ₹${highValueTx.toFixed(0)}. Make sure this was intended and not a typo!`,
                });
            }
        }

        // Tip 5: Positive Reinforcement (if no pending dues)
        if (totalPendingAmount === 0 && groups.length > 0) {
            tips.push({
                id: 'all-settled',
                type: 'positive',
                title: 'All Caught Up!',
                description: 'Great job! You have zero pending settlements. Keep it up!',
            });
        }

        // Tip 6: Smart Saving (Generic logic for now)
        if (groups.length > 2) {
            tips.push({
                id: 'group-optimize',
                type: 'saving',
                title: 'Group Optimization',
                description: 'You are in multiple active groups. Suggest settling weekly to avoid accumulating large debts.',
            });
        }

        res.json(tips);
    } catch (error) {
        console.error("Error generating tips:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export { getFinancialTips };
