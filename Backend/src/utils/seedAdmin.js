const dns = require('dns');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const User = require('../models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    // 1. Primary Admin: admin@gmail.com
    const primaryAdminEmail = 'admin@gmail.com';
    const existingPrimary = await User.findOne({ email: primaryAdminEmail });

    if (!existingPrimary) {
      const admin = new User({
        name: 'System Administrator',
        email: primaryAdminEmail,
        password: 'admin123',
        role: 'admin',
        phone: '9876543210',
        isActive: true,
      });
      await admin.save();
      console.log('Default Primary Admin Created: admin@gmail.com / admin123');
    }

    // 2. Secondary Suite Admin: admin@library.com
    const secondaryAdminEmail = 'admin@library.com';
    const existingSecondary = await User.findOne({ email: secondaryAdminEmail });

    if (!existingSecondary) {
      const suiteAdmin = new User({
        name: 'Library Chief Administrator',
        email: secondaryAdminEmail,
        password: 'admin123',
        role: 'admin',
        phone: '9876543211',
        isActive: true,
      });
      await suiteAdmin.save();
    }
  } catch (error) {
    console.error('Error seeding admin account:', error.message);
  }
};

// If run directly via CLI (e.g. `npm run seed:admin`)
if (require.main === module) {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/library_management';
  mongoose
    .connect(mongoUri)
    .then(async () => {
      console.log('Connected to MongoDB for admin seeding...');
      await seedAdmin();
      await mongoose.disconnect();
      console.log('Admin seeding complete. Disconnected.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding connection error:', err.message);
      process.exit(1);
    });
}

module.exports = seedAdmin;
