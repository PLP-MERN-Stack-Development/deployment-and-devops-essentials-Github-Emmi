/**
 * Database Seeder
 * 
 * This script cleans up the database and seeds it with default data:
 * - Creates default public rooms
 * - Optional: Creates demo users with friendships and friend requests
 * 
 * Usage:
 *   node seed.js              - Seed default rooms only
 *   node seed.js --users      - Seed rooms, demo users, friendships, and friend requests
 *   node seed.js --clean      - Clean database only (no seeding)
 * 
 * When using --users flag, creates:
 * - 5 demo users (admin, demo_user, alice, bob, charlie)
 * - 2 friendships with DM rooms (admin↔demo_user, admin↔alice)
 * - 2 pending friend requests (bob→demo_user, demo_user→charlie)
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
const FriendRequest = require('./models/FriendRequest');
const Friendship = require('./models/Friendship');

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
  {
    username: 'alice_wonder',
    email: 'alice@chatapp.com',
    password: 'alice123456',
    bio: 'Frontend Developer | React Enthusiast',
  },
  {
    username: 'bob_builder',
    email: 'bob@chatapp.com',
    password: 'bob123456',
    bio: 'Backend Engineer | Node.js Expert',
  },
  {
    username: 'charlie_dev',
    email: 'charlie@chatapp.com',
    password: 'charlie123456',
    bio: 'Full Stack Developer | MERN Stack',
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
    
    await Friendship.deleteMany({});
    console.log('  ✓ Deleted all friendships');
    
    await FriendRequest.deleteMany({});
    console.log('  ✓ Deleted all friend requests');
    
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
 * Create friend requests and friendships
 */
const createFriendships = async (users) => {
  try {
    console.log('👫 Creating friendships and friend requests...');
    
    if (users.length < 3) {
      console.log('  ⚠ Not enough users to create friendships (need at least 3)');
      return { friendships: [], friendRequests: [] };
    }
    
    const friendships = [];
    const friendRequests = [];
    
    // Create friendship between user 0 and user 1 (admin and demo_user)
    const dmRoom1 = await Room.create({
      name: `${users[0].username} & ${users[1].username}`,
      roomType: 'direct',
      creator: users[0]._id,
      members: [users[0]._id, users[1]._id],
      admins: [users[0]._id, users[1]._id],
    });
    
    const friendship1 = await Friendship.create({
      user1: users[0]._id,
      user2: users[1]._id,
      conversationRoom: dmRoom1._id,
    });
    
    // Add to friends arrays
    users[0].friends.push(users[1]._id);
    users[1].friends.push(users[0]._id);
    await users[0].save();
    await users[1].save();
    
    // Create system message
    await Message.create({
      sender: users[0]._id,
      room: dmRoom1._id,
      content: `🎉 Your journey with ${users[1].username} begins here! Say hello and start chatting.`,
      messageType: 'system',
    });
    
    friendships.push(friendship1);
    console.log(`  ✓ Created friendship: ${users[0].username} ↔ ${users[1].username}`);
    
    // Create friendship between user 0 and user 2 (admin and alice)
    if (users.length > 2) {
      const dmRoom2 = await Room.create({
        name: `${users[0].username} & ${users[2].username}`,
        roomType: 'direct',
        creator: users[0]._id,
        members: [users[0]._id, users[2]._id],
        admins: [users[0]._id, users[2]._id],
      });
      
      const friendship2 = await Friendship.create({
        user1: users[0]._id,
        user2: users[2]._id,
        conversationRoom: dmRoom2._id,
      });
      
      // Add to friends arrays
      users[0].friends.push(users[2]._id);
      users[2].friends.push(users[0]._id);
      await users[0].save();
      await users[2].save();
      
      // Create system message
      await Message.create({
        sender: users[0]._id,
        room: dmRoom2._id,
        content: `🎉 Your journey with ${users[2].username} begins here! Say hello and start chatting.`,
        messageType: 'system',
      });
      
      friendships.push(friendship2);
      console.log(`  ✓ Created friendship: ${users[0].username} ↔ ${users[2].username}`);
    }
    
    // Create pending friend request from user 3 to user 1 (bob to demo_user)
    if (users.length > 3) {
      const request1 = await FriendRequest.create({
        sender: users[3]._id,
        receiver: users[1]._id,
        status: 'pending',
      });
      
      friendRequests.push(request1);
      console.log(`  ✓ Created friend request: ${users[3].username} → ${users[1].username} (pending)`);
    }
    
    // Create pending friend request from user 1 to user 4 (demo_user to charlie)
    if (users.length > 4) {
      const request2 = await FriendRequest.create({
        sender: users[1]._id,
        receiver: users[4]._id,
        status: 'pending',
      });
      
      friendRequests.push(request2);
      console.log(`  ✓ Created friend request: ${users[1].username} → ${users[4].username} (pending)`);
    }
    
    console.log('✅ Friendships and friend requests created successfully\n');
    return { friendships, friendRequests };
  } catch (error) {
    console.error('❌ Error creating friendships:', error.message);
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
    
    // Create friendships and friend requests (only if demo users were created)
    let friendshipData = { friendships: [], friendRequests: [] };
    if (shouldCreateUsers) {
      friendshipData = await createFriendships(createdUsers);
    }
    
    // Summary
    console.log('╔════════════════════════════════════════╗');
    console.log('║          Seeding Summary               ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`  Users created: ${shouldCreateUsers ? createdUsers.length : 1}`);
    console.log(`  Rooms created: ${rooms.length}`);
    console.log(`  Messages created: ${rooms.length}${shouldCreateUsers ? ` + ${friendshipData.friendships.length} (DM welcome messages)` : ''}`);
    if (shouldCreateUsers) {
      console.log(`  Friendships created: ${friendshipData.friendships.length}`);
      console.log(`  Pending friend requests: ${friendshipData.friendRequests.length}`);
    }
    console.log('\n✅ Database seeding completed successfully!\n');
    
    if (shouldCreateUsers) {
      console.log('📝 Demo Users Credentials:');
      console.log('─────────────────────────────────────────');
      demoUsers.forEach(user => {
        console.log(`  Username: ${user.username}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Password: ${user.password}`);
        console.log(`  Bio: ${user.bio}`);
        console.log('─────────────────────────────────────────');
      });
      console.log('\n💡 Friendship Seeding Info:');
      console.log('  • admin ↔ demo_user (friends with DM)');
      console.log('  • admin ↔ alice_wonder (friends with DM)');
      console.log('  • bob_builder → demo_user (pending request)');
      console.log('  • demo_user → charlie_dev (pending request)');
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
