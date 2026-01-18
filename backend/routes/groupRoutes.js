import express from 'express';
import { createGroup, getUserGroups, getGroupById, addMember, removeMember, updateMemberRole } from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', protect, createGroup);
router.get('/my-groups', protect, getUserGroups);
router.get('/:id', protect, getGroupById);
router.post('/:id/members', protect, addMember);
router.delete('/:id/members/:userId', protect, removeMember);
router.put('/:id/members/:userId', protect, updateMemberRole);

export default router;
