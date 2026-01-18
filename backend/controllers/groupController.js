import Group from '../models/Group.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';

// @desc    Create a new group
// @route   POST /api/groups/create
// @access  Private
const createGroup = async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        res.status(400).json({ message: 'Please add a group name' });
        return;
    }

    // Create Group with richer member structure
    const group = await Group.create({
        name,
        description,
        createdBy: req.user._id,
        members: [{
            user: req.user._id,
            email: req.user.email,
            role: 'admin',
            status: 'joined'
        }]
    });

    // Log Activity
    await Activity.create({
        user: req.user._id,
        type: 'CREATE_GROUP',
        description: `You created the group "${group.name}"`,
        metadata: { groupId: group._id, groupName: group.name }
    });

    res.status(201).json(group);
};

// @desc    Get user groups
// @route   GET /api/groups/my-groups
// @access  Private
const getUserGroups = async (req, res) => {
    // New Schema: query inside 'members' array for 'user' field
    const groups = await Group.find({ 'members.user': req.user._id })
        .populate('expenses.paidBy', 'name email')
        .populate('expenses.splits.user', 'name email')
        .sort({ createdAt: -1 });
    res.status(200).json(groups);
};

// @desc    Get group by ID
// @route   GET /api/groups/:id
// @access  Private
const getGroupById = async (req, res) => {
    const group = await Group.findById(req.params.id)
        .populate('members.user', 'name email avatar');

    if (!group) {
        res.status(404).json({ message: 'Group not found' });
        return;
    }

    // Check membership (flattened check)
    const isMember = group.members.some(m => m.user?._id.toString() === req.user._id.toString());
    if (!isMember) {
        res.status(404).json({ message: 'Group not found' }); // Hide via 404
        return;
    }

    // MAP response to maintain frontend compatibility (flat members list)
    // Frontend expects: { _id, name, members: [{ _id, name, email, avatar, status, role }] }
    const formattedGroup = {
        _id: group._id,
        name: group.name,
        description: group.description,
        createdBy: group.createdBy,
        admins: group.members.filter(m => m.role === 'admin').map(m => m.user?._id || m.user), // Backwards compat for "admins" array check if needed
        members: group.members.map(m => ({
            _id: m.user?._id || m._id, // Handle invite-only (no user doc yet)
            name: m.user?.name || m.email.split('@')[0],
            email: m.email,
            avatar: m.user?.avatar,
            status: m.status, // Real status from DB!
            role: m.role
        }))
    };

    res.json(formattedGroup);
};

// @desc    Add member to group
// @route   POST /api/groups/:id/members
// @access  Private
const addMember = async (req, res) => {
    const { email } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
        res.status(404).json({ message: 'Group not found' });
        return;
    }

    // Check if user is admin/creator? For now, allow any member to invite??
    // Prompt says "Edit Group" is Admin only, but "Add Member" just says input field.
    // Let's assume any member can invite OR restricted.
    // Check if req.user is admin
    // In new schema, find member with role='admin'
    const requester = group.members.find(m => m.user?.toString() === req.user._id.toString());
    if (!requester || (requester.role !== 'admin' && group.createdBy.toString() !== req.user._id.toString())) {
        // Technically creator should be admin, but backup check
        res.status(401).json({ message: 'Not authorized' });
        return;
    }

    const userToAdd = await User.findOne({ email });
    const existingMember = group.members.find(m => m.email === email);

    if (existingMember) {
        res.status(400).json({ message: 'User already in group' });
        return;
    }

    const newMember = {
        email: email,
        user: userToAdd ? userToAdd._id : null,
        status: 'invited',
        role: 'member'
    };

    group.members.push(newMember);
    await group.save();

    // Log Activity for Inviter
    await Activity.create({
        user: req.user._id,
        type: 'INVITE_MEMBER',
        description: `You invited ${email} to "${group.name}"`,
        metadata: { groupId: group._id, groupName: group.name, targetUserEmail: email }
    });

    // Return populated member for UI update
    res.status(200).json({
        _id: userToAdd ? userToAdd._id : newMember._id, // If no user, use subdoc ID
        name: userToAdd ? userToAdd.name : email.split('@')[0],
        email: email,
        status: 'invited',
        role: 'member'
    });
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private (Admin only)
const removeMember = async (req, res) => {
    const group = await Group.findById(req.params.id);

    if (!group) {
        res.status(404).json({ message: 'Group not found' });
        return;
    }

    // Check if requester is Admin
    // New Schema Check
    const requester = group.members.find(m => m.user?.toString() === req.user._id.toString());
    const isAdmin = requester && (requester.role === 'admin');

    if (!isAdmin) {
        res.status(401).json({ message: 'Not authorized as admin' });
        return;
    }

    const userIdToRemove = req.params.userId;

    // Filter out the member with this User ID (or subdoc ID if needed)
    group.members = group.members.filter(m => {
        const uId = m.user?.toString();
        const mId = m._id.toString();
        return uId !== userIdToRemove && mId !== userIdToRemove;
    });

    await group.save();

    // Log Activity
    await Activity.create({
        user: req.user._id,
        type: 'REMOVE_MEMBER',
        description: `You removed a member from "${group.name}"`,
        metadata: { groupId: group._id, groupName: group.name }
    });

    res.status(200).json({ message: 'Member removed' });
};

// @desc    Update member role (Promote/Demote)
// @route   PUT /api/groups/:id/members/:userId
// @access  Private (Admin only)
const updateMemberRole = async (req, res) => {
    const { role } = req.body; // 'admin' or 'member'
    const group = await Group.findById(req.params.id);

    if (!group) {
        res.status(404).json({ message: 'Group not found' });
        return;
    }

    // Check admin
    const requester = group.members.find(m => m.user?.toString() === req.user._id.toString());
    if (!requester || requester.role !== 'admin') {
        res.status(401).json({ message: 'Not authorized as admin' });
        return;
    }

    const targetUserId = req.params.userId;

    // Find the target member
    const member = group.members.find(m => m.user?.toString() === targetUserId || m._id.toString() === targetUserId);
    if (member) {
        member.role = role === 'admin' ? 'admin' : 'member';
        await group.save();
        res.status(200).json({ message: `User role updated to ${role}` });
    } else {
        res.status(404).json({ message: 'Member not found' });
    }
};

export { createGroup, getUserGroups, getGroupById, addMember, removeMember, updateMemberRole };
