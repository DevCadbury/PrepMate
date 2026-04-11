const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../utils/logger');
require('dotenv').config();

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Check if superadmin already exists
    const existingAdmin = await User.findOne({ email: 'admin@prepmate.com' });
    
    if (existingAdmin) {
      logger.info('Superadmin already exists');
      console.log('✅ Superadmin already exists with email: admin@prepmate.com');
      console.log('📧 Email: admin@prepmate.com');
      console.log('🔑 Password: admin123');
      return;
    }

    // Create superadmin user
    const superAdmin = await User.create({
      name: 'Super Admin',
      username: 'superadmin',
      email: 'admin@prepmate.com',
      password: 'admin123',
      role: 'admin',
      adminRole: 'superadmin',
      isActive: true,
      emailVerified: true,
      subscription: 'premium',
      permissions: ['*'],
    });

    logger.info('Superadmin created successfully');
    console.log('✅ Superadmin created successfully!');
    console.log('📧 Email: admin@prepmate.com');
    console.log('🔑 Password: admin123');
    console.log('🎯 Role: admin');
    console.log('🔗 Access URL: http://localhost:3000/admin');

  } catch (error) {
    logger.error('Error creating superadmin:', error);
    console.error('❌ Error creating superadmin:', error.message);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
};

// Run the script
createSuperAdmin(); 