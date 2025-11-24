# 🌱 Database Seeder Documentation

## Overview

The `seed.js` script allows you to quickly populate your database with default data for development and testing purposes. It cleans up the existing data and creates fresh default rooms and optional demo users.

---

## 📋 Features

- ✅ **Clean Database**: Removes all existing users, rooms, and messages
- ✅ **Default Rooms**: Creates 4 public rooms with descriptions
- ✅ **Demo Users**: Optional creation of test users with credentials
- ✅ **Welcome Messages**: Automatically adds welcome messages to each room
- ✅ **System User**: Creates a system account for automated tasks

---

## 🚀 Usage

### Basic Seeding (Rooms Only)

Creates default rooms with a system user:

```bash
# Navigate to server directory
cd server

# Run seeder
npm run seed
```

**What it creates:**
- 1 system user
- 4 public rooms (General, Random, Tech Talk, Help & Support)
- 4 welcome messages (one per room)

### Seed with Demo Users

Creates default rooms and demo users for testing:

```bash
npm run seed:users
```

**What it creates:**
- 2 demo users (admin, demo_user)
- 4 public rooms
- 4 welcome messages

**Demo Credentials:**
```
Email: admin@chatapp.com
Password: admin123456

Email: demo@chatapp.com
Password: demo123456
```

### Clean Database Only

Removes all data without seeding:

```bash
npm run seed:clean
```

---

## 📦 Default Rooms Created

### 1. General
- **Type**: Public
- **Description**: General discussion for all topics
- **Purpose**: Main conversation room

### 2. Random
- **Type**: Public
- **Description**: Random conversations and fun topics
- **Purpose**: Casual chat and off-topic discussions

### 3. Tech Talk
- **Type**: Public
- **Description**: Discuss technology, programming, and development
- **Purpose**: Technical discussions

### 4. Help & Support
- **Type**: Public
- **Description**: Get help and support from the community
- **Purpose**: User support and assistance

---

## 🔧 Command Line Options

### Available Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--users` | Create demo users along with rooms | `node seed.js --users` |
| `--clean` | Clean database only (no seeding) | `node seed.js --clean` |
| (none) | Default: Create rooms only | `node seed.js` |

---

## 📝 NPM Scripts

Add these to your workflow:

```json
{
  "scripts": {
    "seed": "node seed.js",              // Seed rooms only
    "seed:users": "node seed.js --users", // Seed with demo users
    "seed:clean": "node seed.js --clean"  // Clean database only
  }
}
```

---

## 💻 Manual Execution

### Run Directly

```bash
# From server directory
node seed.js

# With options
node seed.js --users
node seed.js --clean
```

### From Project Root

```bash
# Using npm
cd server && npm run seed

# Or directly
node server/seed.js
```

---

## 🔒 Environment Variables Required

The seeder requires these environment variables in `server/.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp
```

Ensure your MongoDB connection is configured before running the seeder.

---

## 📊 Seeding Process

The script follows this sequence:

1. **Connect to Database**
   - Reads `MONGODB_URI` from `.env`
   - Establishes MongoDB connection

2. **Clean Database** (Always runs)
   - Deletes all messages
   - Deletes all rooms
   - Deletes all users

3. **Create Users**
   - If `--users`: Creates demo users
   - If not: Creates system user only

4. **Create Rooms**
   - Creates 4 default public rooms
   - Assigns creator and admin roles
   - Adds creator as first member

5. **Create Welcome Messages**
   - Adds system message to each room
   - Updates room's `lastMessage` field

6. **Display Summary**
   - Shows counts of created items
   - Displays demo user credentials (if applicable)

---

## 🎯 Use Cases

### Development Setup

```bash
# Fresh start for development
npm run seed:users

# Start your dev server
npm run dev
```

### Testing

```bash
# Reset database before tests
npm run seed:clean

# Run tests
npm test
```

### Production Initialization

```bash
# Create default rooms on first deploy
npm run seed
```

---

## ⚠️ Important Notes

### ⚡ Destructive Operation

**WARNING**: The seeder **deletes all existing data** before creating new records.

- All users will be removed
- All rooms will be deleted
- All messages will be lost
- **Never run in production** with existing user data

### 🔐 Security

- Demo user passwords are hardcoded for development only
- Change passwords in production
- System user should be disabled or secured in production

### 🗄️ Database State

After seeding:
- Database is in a clean, known state
- Perfect for development and testing
- All rooms are public and accessible
- Demo users can log in immediately

---

## 📚 Examples

### Quick Development Setup

```bash
# Terminal 1: Seed database
cd server
npm run seed:users

# Terminal 2: Start server
npm run dev

# Terminal 3: Start client
cd ../client
npm run dev
```

### Reset During Development

```bash
# Quick reset and reseed
npm run seed:users && npm run dev
```

### Clean Before Deployment

```bash
# Clean test data
npm run seed:clean

# Or seed production defaults
npm run seed
```

---

## 🐛 Troubleshooting

### Error: Cannot connect to database

**Problem**: MongoDB connection failed

**Solution**:
1. Check `MONGODB_URI` in `.env`
2. Verify MongoDB Atlas network access
3. Ensure database user credentials are correct

### Error: User validation failed

**Problem**: Username or email already exists

**Solution**:
- Run with `--clean` flag first
- Or manually delete existing users

### Rooms not appearing

**Problem**: Rooms created but not visible

**Solution**:
1. Check if rooms were created successfully
2. Verify room creator exists
3. Check application code for room fetching logic

---

## 🔄 Customization

### Add More Rooms

Edit `seed.js` and add to `defaultRooms` array:

```javascript
const defaultRooms = [
  {
    name: 'Your Room Name',
    description: 'Your room description',
    roomType: 'public',
  },
  // ... existing rooms
];
```

### Add More Users

Edit `demoUsers` array:

```javascript
const demoUsers = [
  {
    username: 'youruser',
    email: 'your@email.com',
    password: 'yourpassword',
    bio: 'Your bio',
  },
  // ... existing users
];
```

### Custom Messages

Modify `createWelcomeMessages` function to customize welcome messages.

---

## ✅ Best Practices

1. **Development**: Use `npm run seed:users` for quick setup
2. **Testing**: Clean before each test run
3. **Production**: Only seed rooms, not demo users
4. **Version Control**: Don't commit changes to demo passwords
5. **Backups**: Never run seeder on production database without backup

---

## 📞 Support

If you encounter issues:

1. Check MongoDB connection in `.env`
2. Verify all models are properly defined
3. Check console output for specific errors
4. Review database logs in MongoDB Atlas

---

**Last Updated**: November 24, 2025  
**Version**: 1.0.0
