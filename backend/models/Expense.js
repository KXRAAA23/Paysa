import mongoose from 'mongoose';

const splitSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    settled: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const expenseSchema = mongoose.Schema(
    {
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        paidBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        splits: [splitSchema],
    },
    {
        timestamps: true,
    }
);

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
