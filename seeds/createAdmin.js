require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User.model');

async function createAdmin() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  try {
    const email = process.argv[2] || 'admin@nexohr.com';
    const password = process.argv[3] || 'Admin@123456';
    const role = process.argv[4] || 'superadmin';

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`User with email ${email} already exists. Updating password and role.`);
      existing.password = password;
      existing.role = role;
      await existing.save();
      console.log('Updated existing admin.');
    } else {
      await User.create({ name: 'NEXO Admin', email, password, role });
      console.log('Admin user created:');
      console.log(`  Email: ${email}`);
      console.log(`  Password: ${password}`);
      console.log(`  Role: ${role}`);
    }
  } catch (err) {
    console.error('Failed to create admin:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
