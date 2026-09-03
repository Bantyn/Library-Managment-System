const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    const adminEmail = 'admin@library.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      // Create default admin
      // Note: User model pre-save hook will hash the password automatically
      const admin = new User({
        name: 'System Administrator',
        email: adminEmail,
        password: 'admin123',
        role: 'admin',
        phone: '1234567890',
        isActive: true,
      });

      await admin.save();
      console.log('----------------------------------------------------');
      console.log('Default Admin Account Created Successfully!');
      console.log('Email: admin@library.com');
      console.log('Password: admin123');
      console.log('(Note: Change this password in production environments)');
      console.log('----------------------------------------------------');
    } else {
      console.log('Admin account already exists.');
    }
  } catch (error) {
    console.error('Error seeding admin account:', error.message);
  }
};

// If run directly via CLI (e.g. `npm run seed`)
if (require.main === module) {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/library_management';
  mongoose
    .connect(mongoUri)
    .then(async () => {
      console.log('Connected to MongoDB for seeding...');
      await seedAdmin();
      await mongoose.disconnect();
      console.log('Seeding complete. Disconnected.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding connection error:', err.message);
      process.exit(1);
    });
}

module.exports = seedAdmin;
