require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User.model');

async function updatePassword() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  try {
    const email = process.argv[2];
    const password = process.argv[3];
    if (!email || !password) {
      console.error('Usage: node updateAdminPassword.js <email> <newPassword>');
      process.exit(1);
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    user.password = password;
    await user.save();
    console.log('Password updated successfully for', email);
  } catch (err) {
    console.error('Failed to update password:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

updatePassword();
