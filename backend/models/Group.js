import mongoose from 'mongoose';

const groupSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        members: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            email: { type: String, required: true },
            role: { type: String, enum: ['admin', 'member'], default: 'member' },
            status: { type: String, enum: ['invited', 'joined'], default: 'joined' }
        }],

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        expenses: [{
            title: { type: String, required: true },
            totalAmount: { type: Number, required: true },
            category: { type: String, default: 'General' },
            paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            createdAt: { type: Date, default: Date.now },
            billUrl: { type: String },
            splits: [{
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
                amount: { type: Number, required: true },
                settled: { type: Boolean, default: false }
            }]
        }]
    },
    {
        timestamps: true,
    }
);

const Group = mongoose.model('Group', groupSchema);

export default Group;
