const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function reset() {
  await mongoose.connect(process.env.MONGO_URI);
  const hashed = await bcrypt.hash('Demo@123', 10);
  await User.updateMany(
    { email: { $in: ['viji25@gmail.com', 'viji26@gmail.com', 'demo_inst@test.com'] } },
    { password: hashed }
  );
  console.log('✅ Demo Credentials Reset');
  process.exit();
}

reset();
