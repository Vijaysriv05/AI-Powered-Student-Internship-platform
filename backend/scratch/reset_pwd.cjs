const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetPasswords() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({
            email: String,
            password: String
        }, { strict: false }));

        const newPasswordHash = await bcrypt.hash('Demo@123', 10);
        
        await User.updateMany(
            { email: { $in: ['viji25@gmail.com', 'viji26@gmail.com', 'demo_inst@test.com'] } },
            { password: newPasswordHash }
        );

        console.log('✅ Passwords successfully updated to "Demo@123" for testing!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

resetPasswords();
