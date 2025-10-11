const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../utils/logger');
require('dotenv').config();

const sampleUsers = [
  {
    name: 'John Student',
    email: 'john.student@example.com',
    password: 'password123',
    role: 'student',
    isActive: true,
    isEmailVerified: true,
    subscription: 'basic',
    stats: {
      questionsSolved: 45,
      averageScore: 78,
      streakDays: 12,
      totalTime: 3600,
    },
  },
  {
    name: 'Sarah Teacher',
    email: 'sarah.teacher@example.com',
    password: 'password123',
    role: 'teacher',
    isActive: true,
    isEmailVerified: true,
    subscription: 'premium',
    stats: {
      questionsSolved: 120,
      averageScore: 85,
      streakDays: 25,
      totalTime: 7200,
    },
  },
  {
    name: 'Mike HR',
    email: 'mike.hr@example.com',
    password: 'password123',
    role: 'hr',
    isActive: true,
    isEmailVerified: true,
    subscription: 'premium',
    stats: {
      questionsSolved: 80,
      averageScore: 82,
      streakDays: 18,
      totalTime: 5400,
    },
  },
  {
    name: 'Lisa Student',
    email: 'lisa.student@example.com',
    password: 'password123',
    role: 'student',
    isActive: false,
    isEmailVerified: true,
    subscription: 'free',
    stats: {
      questionsSolved: 15,
      averageScore: 65,
      streakDays: 3,
      totalTime: 1200,
    },
  },
  {
    name: 'David Teacher',
    email: 'david.teacher@example.com',
    password: 'password123',
    role: 'teacher',
    isActive: true,
    isEmailVerified: false,
    subscription: 'basic',
    stats: {
      questionsSolved: 95,
      averageScore: 88,
      streakDays: 20,
      totalTime: 6000,
    },
  },
];

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Clear existing users (except admin)
    await User.deleteMany({ email: { $ne: 'admin@prepmate.com' } });
    logger.info('Cleared existing users');

    // Create sample users
    const createdUsers = await User.insertMany(sampleUsers);
    logger.info(`Created ${createdUsers.length} sample users`);

    console.log('✅ Sample users created successfully!');
    console.log(`📊 Created ${createdUsers.length} users:`);
    
    createdUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role} - ${user.isActive ? 'Active' : 'Inactive'}`);
    });

    console.log('\n🔗 Admin Dashboard: http://localhost:3000/admin');
    console.log('📧 Admin Email: admin@prepmate.com');
    console.log('🔑 Admin Password: admin123');

  } catch (error) {
    logger.error('Error seeding users:', error);
    console.error('❌ Error seeding users:', error.message);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
};

// Run the script
seedUsers(); 