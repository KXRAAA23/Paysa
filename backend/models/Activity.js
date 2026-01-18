import mongoose from 'mongoose';

const activitySchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['CREATE_GROUP', 'JOIN_GROUP', 'INVITE_MEMBER', 'REMOVE_MEMBER', 'PROMOTE_MEMBER', 'DEMOTE_MEMBER', 'CREATE_EXPENSE', 'SETTLE_EXPENSE'],
        },
        description: {
            type: String,
            required: true,
        },
        metadata: {
            groupId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Group',
            },
            groupName: String,
            targetUserEmail: String,
        }
    },
    {
        timestamps: true,
    }
);

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
