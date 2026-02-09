import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to, subject, text, html) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

export const sendExpenseNotification = async (expense, group, paidByUser) => {
    // splits contain { user: ObjectId, amount: Number }
    // We need to fetch user emails (or assuming populated) or just expect them passed in/handled
    // This function assumes 'expense' has populated data or we fetch it.
    // Ideally, the caller should pass necessary details or we fetch here.

    // For now, let's assume the caller passes fully populated expense or we can't send emails easily without querying.
    // But expenseController.js createExpense does not populate immediately.
    // So we might need to rely on the caller to provide member details from the group object which IS available in createExpense.

    const { title, totalAmount, splits } = expense;

    // The group object passed from controller has 'members' populated with user details?
    // In createExpense: const group = await Group.findById(groupId);
    // group.members is array of { user: ObjectId, email: String, ... }

    // Let's filter splits to find who owes what
    for (const split of splits) {
        if (split.user.toString() === paidByUser._id.toString()) continue; // Skip payer

        // Find member email
        const member = group.members.find(m => m.user?.toString() === split.user.toString());
        if (member && member.email) {
            // Check User Notification Preferences
            try {
                // We need to fetch the user to check their settings
                // The group member object might not have the preferences populated if it's just from the group doc
                // If member.user is an ID, fetch the user.
                const user = await import('../models/User.js').then(mod => mod.default.findById(member.user));

                if (user && user.notificationPreferences && user.notificationPreferences.expenses === false) {
                    console.log(`Skipping expense email for ${member.email} (User disabled notifications)`);
                    continue;
                }
            } catch (err) {
                console.error("Error checking notification preferences:", err);
                // Fallback: send email if check fails? Or skip? Let's skip to be safe/less annoying.
                continue;
            }

            const subject = `New Expense: ${title} in ${group.name}`;
            const text = `
Hello,

${paidByUser.name} added a new expense "${title}" (Total: ₹${totalAmount}) in the group "${group.name}".

Your share is: ₹${split.amount}.

Please settle this at your earliest convenience.

- Paysa Team
            `;

            await sendEmail(member.email, subject, text);
        }
    }
};
