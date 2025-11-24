/**
 * Database Seeder
 * 
 * This script cleans up the database and seeds it with default data:
 * - Creates default public rooms
 * - Optional: Creates demo users
 * 
 * Usage:
 *   node seed.js              - Seed default rooms only
 *   node seed.js --users      - Seed rooms and demo users
 *   node seed.js --clean      - Clean database only (no seeding)
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
const User = require('./models/User');
const Room = require('./models/Room');
const Message = require('./models/Message');

// Default rooms configuration
const defaultRooms = [
  {
    name: 'General',
    description: 'General discussion for all topics',
    roomType: 'public',
  },
  {
    name: 'Random',
    description: 'Random conversations and fun topics',
    roomType: 'public',
  },
  {
    name: 'Tech Talk',
    description: 'Discuss technology, programming, and development',
    roomType: 'public',
  },
  {
    name: 'Help & Support',
    description: 'Get help and support from the community',
    roomType: 'public',
  },
];

// Demo users (optional)
const demoUsers = [
  {
    username: 'admin',
    email: 'admin@chatapp.com',
    password: 'admin123456',
    bio: 'System Administrator',
  },
  {
    username: 'demo_user',
    email: 'demo@chatapp.com',
    password: 'demo123456',
    bio: 'Demo user for testing',
  },
];

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

/**
 * Clean up database
 */
const cleanDatabase = async () => {
  try {
    console.log('\n🧹 Cleaning database...');
    
    await Message.deleteMany({});
    console.log('  ✓ Deleted all messages');
    
    await Room.deleteMany({});
    console.log('  ✓ Deleted all rooms');
    
    await User.deleteMany({});
    console.log('  ✓ Deleted all users');
    
    console.log('✅ Database cleaned successfully\n');
  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
    throw error;
  }
};

/**
 * Create demo users
 */
const createUsers = async () => {
  try {
    console.log('👥 Creating demo users...');
    
    const users = [];
    for (const userData of demoUsers) {
      const user = await User.create(userData);
      users.push(user);
      console.log(`  ✓ Created user: ${user.username} (${user.email})`);
    }
    
    console.log('✅ Demo users created successfully\n');
    return users;
  } catch (error) {
    console.error('❌ Error creating users:', error.message);
    throw error;
  }
};

/**
 * Create default rooms
 */
const createRooms = async (creatorId) => {
  try {
    console.log('🏠 Creating default rooms...');
    
    const rooms = [];
    for (const roomData of defaultRooms) {
      const room = await Room.create({
        ...roomData,
        creator: creatorId,
      });
      rooms.push(room);
      console.log(`  ✓ Created room: ${room.name} (${room.roomType})`);
      console.log(`    Description: ${room.description}`);
    }
    
    console.log('✅ Default rooms created successfully\n');
    return rooms;
  } catch (error) {
    console.error('❌ Error creating rooms:', error.message);
    throw error;
  }
};

/**
 * Create welcome messages in rooms
 */
const createWelcomeMessages = async (rooms, systemUser) => {
  try {
    console.log('💬 Creating welcome messages...');
    
    for (const room of rooms) {
      const message = await Message.create({
        sender: systemUser._id,
        content: `Welcome to ${room.name}! ${room.description}`,
        room: room._id,
        messageType: 'system',
      });
      
      // Update room's last message
      room.lastMessage = message._id;
      await room.save();
      
      console.log(`  ✓ Welcome message for: ${room.name}`);
    }
    
    console.log('✅ Welcome messages created successfully\n');
  } catch (error) {
    console.error('❌ Error creating welcome messages:', error.message);
    throw error;
  }
};

/**
 * Main seeder function
 */
const seedDatabase = async () => {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const shouldCreateUsers = args.includes('--users');
    const cleanOnly = args.includes('--clean');
    
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║     Database Seeder for Chat App      ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    // Connect to database
    await connectDB();
    
    // Clean database
    await cleanDatabase();
    
    if (cleanOnly) {
      console.log('✅ Database cleaned. Exiting...\n');
      process.exit(0);
    }
    
    // Create system user for room creation
    let systemUser;
    let createdUsers = [];
    
    if (shouldCreateUsers) {
      createdUsers = await createUsers();
      systemUser = createdUsers[0]; // Use first demo user as creator
    } else {
      // Create a temporary system user for room creation
      console.log('👤 Creating system user...');
      systemUser = await User.create({
        username: 'system',
        email: 'system@chatapp.com',
        password: 'system123456',
        bio: 'System account for automated tasks',
      });
      console.log('  ✓ System user created\n');
    }
    
    // Create default rooms
    const rooms = await createRooms(systemUser._id);
    
    // Create welcome messages
    await createWelcomeMessages(rooms, systemUser);
    
    // Summary
    console.log('╔════════════════════════════════════════╗');
    console.log('║          Seeding Summary               ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`  Users created: ${shouldCreateUsers ? createdUsers.length : 1}`);
    console.log(`  Rooms created: ${rooms.length}`);
    console.log(`  Messages created: ${rooms.length}`);
    console.log('\n✅ Database seeding completed successfully!\n');
    
    if (shouldCreateUsers) {
      console.log('📝 Demo Users Credentials:');
      console.log('─────────────────────────────────────────');
      demoUsers.forEach(user => {
        console.log(`  Email: ${user.email}`);
        console.log(`  Password: ${user.password}`);
        console.log('─────────────────────────────────────────');
      });
      console.log('');
    } else {
      console.log('💡 Tip: Run with --users flag to create demo users');
      console.log('   Example: node seed.js --users\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
