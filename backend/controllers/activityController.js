import Activity from '../models/Activity.js';

// @desc    Get current user's recent activity
// @route   GET /api/activity
// @access  Private
const getRecentActivity = async (req, res) => {
    try {
        const activities = await Activity.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export { getRecentActivity };
