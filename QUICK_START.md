# 🚀 Quick Start Guide - Real-Time Chat Application

## Get Up and Running in 5 Minutes!

---

## ⚡ Prerequisites Check

Make sure you have these installed:

```bash
# Check Node.js version (need v18+)
node --version

# Check npm version (need v9+)
npm --version

# Check if MongoDB is installed (or use MongoDB Atlas)
mongod --version
```

If you don't have these, install:
- **Node.js**: https://nodejs.org/ (LTS version)
- **MongoDB**: https://www.mongodb.com/try/download/community (or use Atlas cloud)

---

## 📦 Step 1: Install Dependencies (2 minutes)

Open two terminal windows/tabs:

### Terminal 1 - Server
```bash
cd server
npm install
```

### Terminal 2 - Client
```bash
cd client
npm install
```

**Wait for installation to complete...**

---

## ⚙️ Step 2: Configure Environment (1 minute)

```bash
cd server

# Copy environment template
cp .env.example .env

# Edit .env file (use nano, vim, or any text editor)
nano .env
```

**Minimal .env configuration:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/socketio-chat
JWT_SECRET=your_super_secret_jwt_key_change_this_to_random_string
CLIENT_URL=http://localhost:5173
```

**Important**: Change `JWT_SECRET` to a random string for security!

**If using MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/socketio-chat
```

Save and close the file.

---

## 🏃 Step 3: Start MongoDB (if using local)

### macOS (with Homebrew):
```bash
brew services start mongodb-community
```

### Linux:
```bash
sudo systemctl start mongod
```

### Windows:
MongoDB should start automatically after installation.

**Skip this step if using MongoDB Atlas!**

---

## 🚀 Step 4: Run the Application (1 minute)

### Terminal 1 - Start Server
```bash
cd server
npm run dev
```

You should see:
```
╔════════════════════════════════════════════╗
║   Socket.io Chat Server Running            ║
║   Port: 5000                               ║
║   Environment: development                 ║
║   Client URL: http://localhost:5173        ║
╚════════════════════════════════════════════╝
```

### Terminal 2 - Start Client
```bash
cd client
npm run dev
```

You should see:
```
  VITE v5.0.11  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🎉 Step 5: Open and Test (1 minute)

1. **Open browser**: Navigate to `http://localhost:5173`

2. **Register**: Create a new account
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`

3. **Login**: Sign in with your credentials

4. **Create Room**: Click the "+" button to create a chat room
   - Name: `General`
   - Description: `General discussion`

5. **Start Chatting**: Send your first message! 🎊

---

## ✅ Verification Checklist

- [ ] Server running on port 5000
- [ ] Client running on port 5173
- [ ] MongoDB connected (no connection errors)
- [ ] Can register new user
- [ ] Can login successfully
- [ ] Can create chat room
- [ ] Can send messages
- [ ] Messages appear in real-time
- [ ] Can see online users

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"
**Solution**: 
- Make sure MongoDB is running: `brew services list` (macOS) or `sudo systemctl status mongod` (Linux)
- Or use MongoDB Atlas cloud database

### Issue: "Port 5000 already in use"
**Solution**: 
- Change PORT in .env to 5001 or another available port
- Or stop the service using port 5000

### Issue: "Port 5173 already in use"
**Solution**:
- Kill the process or let Vite choose another port
- Vite will automatically suggest an alternative port

### Issue: "JWT token invalid"
**Solution**:
- Clear browser localStorage
- Make sure JWT_SECRET is set in .env
- Try registering a new user

### Issue: "Cannot find module"
**Solution**:
- Run `npm install` again in both client and server
- Delete `node_modules` and run `npm install` fresh

---

## 🧪 Test All Features

Once running, test these features:

1. **Authentication**
   - [x] Register new user
   - [x] Login
   - [x] Logout

2. **Chat Rooms**
   - [x] Create room
   - [x] Join room
   - [x] Send messages
   - [x] See messages in real-time

3. **Real-Time Features**
   - [x] See online users
   - [x] Typing indicators (start typing)
   - [x] Reactions (hover over message)

4. **Notifications**
   - [x] Browser notifications (allow when prompted)
   - [x] Sound alerts
   - [x] Unread count badge

5. **File Sharing**
   - [x] Upload image
   - [x] Upload PDF
   - [x] View uploaded files

---

## 📱 Open Multiple Browser Windows

To test real-time chat:

1. Open `http://localhost:5173` in **Chrome**
2. Open `http://localhost:5173` in **Firefox** (or Incognito)
3. Register different users in each
4. Join same room
5. Send messages between them
6. Watch messages appear instantly! ✨

---

## 🎯 What's Next?

- ✅ Read the full **README.md** for detailed documentation
- ✅ Review **PROJECT_SUMMARY.md** for complete feature list
- ✅ Explore the code structure
- ✅ Customize the UI
- ✅ Add your own features
- ✅ Deploy to production (see README.md deployment section)

---

## 📚 Useful Commands

### Server Commands
```bash
cd server
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm test         # Run tests
```

### Client Commands
```bash
cd client
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Database Commands
```bash
# Connect to MongoDB shell
mongosh

# Show databases
show dbs

# Use chat database
use socketio-chat

# Show collections
show collections

# Find all users
db.users.find()

# Find all messages
db.messages.find()
```

---

## 💡 Pro Tips

1. **Keep Both Terminals Open**: Server and client must run simultaneously
2. **Check Console Logs**: Errors appear in browser console (F12)
3. **MongoDB Compass**: Use MongoDB Compass GUI to view database
4. **Postman**: Test API endpoints with Postman
5. **React DevTools**: Install React Developer Tools browser extension

---

## 🆘 Need Help?

1. Check the **README.md** for comprehensive documentation
2. Review **PROJECT_SUMMARY.md** for feature details
3. Check server terminal for backend errors
4. Check browser console (F12) for frontend errors
5. Verify .env configuration
6. Make sure all dependencies installed correctly

---

## 🎊 Success!

If you see your messages appearing in real-time across multiple browser windows, **CONGRATULATIONS!** 🎉

Your real-time chat application is working perfectly!

---

**Happy Chatting! 💬**

*Built with React, Node.js, Express, MongoDB, and Socket.io*
