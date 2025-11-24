# 🤝 Friend Request Feature - Complete Implementation Plan

## Overview
Complete "Search User + Friend Request + Direct Message" system for EmmiDev-Chat

---

## 📊 Database Schema Changes

### 1. New Models

#### FriendRequest Model
```javascript
{
  _id: ObjectId,
  sender: ObjectId (ref: User),
  receiver: ObjectId (ref: User),
  status: String (enum: ['pending', 'accepted', 'declined']),
  createdAt: Date,
  updatedAt: Date
}
```

#### Friendship Model
```javascript
{
  _id: ObjectId,
  user1: ObjectId (ref: User),
  user2: ObjectId (ref: User),
  createdAt: Date,
  conversationRoom: ObjectId (ref: Room)
}
```

### 2. User Model Updates
```javascript
// Add to existing User schema
{
  friends: [{ type: ObjectId, ref: 'User' }],
  // Methods to add:
  // - isFriend(userId)
  // - getPendingRequests()
  // - getSentRequests()
}
```

### 3. Room Model Updates
```javascript
// Add to existing Room schema
{
  friendship: { type: ObjectId, ref: 'Friendship' }, // For friend-only DMs
  // roomType: 'direct' only created between friends
}
```

---

## 🛣️ API Endpoints

### Friend Routes (`/api/friends`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/search` | Search user by email | ✅ |
| POST | `/request` | Send friend request | ✅ |
| POST | `/accept/:id` | Accept friend request | ✅ |
| POST | `/decline/:id` | Decline friend request | ✅ |
| GET | `/requests` | Get pending requests | ✅ |
| GET | `/` | Get friends list | ✅ |
| DELETE | `/:userId` | Remove friend | ✅ |

### Request/Response Examples

**POST /api/friends/search**
```json
// Request
{ "email": "john@example.com" }

// Response - Not Found
{ "success": false, "message": "No user found" }

// Response - Found, Not Friend
{
  "success": true,
  "user": {
    "_id": "...",
    "username": "john_doe",
    "email": "john@example.com",
    "avatar": "...",
    "isFriend": false,
    "hasPendingRequest": false,
    "requestSent": false
  }
}

// Response - Already Friends
{
  "success": true,
  "user": {
    "_id": "...",
    "username": "john_doe",
    "isFriend": true,
    "conversationId": "room_id_here"
  }
}
```

**POST /api/friends/request**
```json
// Request
{ "receiverId": "user_id_here" }

// Response
{
  "success": true,
  "message": "Friend request sent",
  "data": {
    "_id": "request_id",
    "sender": {...},
    "receiver": {...},
    "status": "pending"
  }
}
```

---

## ⚡ Socket.IO Events

### New Events to Emit/Listen

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `friend_request_received` | Server → Client | `{ requestId, sender: { _id, username, avatar } }` | When user receives a request |
| `friend_request_accepted` | Server → Client | `{ requestId, acceptedBy, conversationId }` | When request is accepted |
| `friend_request_declined` | Server → Client | `{ requestId, declinedBy }` | When request is declined |
| `friendship_created` | Server → Client | `{ friendshipId, friend, conversationId }` | New friendship established |
| `friend_online` | Server → Client | `{ userId, username, status }` | Friend comes online |
| `friend_offline` | Server → Client | `{ userId, lastSeen }` | Friend goes offline |

---

## 🎨 Frontend Components

### 1. SearchBar Component
**Location:** `client/src/components/SearchBar.jsx`

**Features:**
- Email input with debounce (500ms)
- Search results modal
- Display user info (avatar, username, email)
- Action buttons based on status:
  - "Send Request" (not friend)
  - "Already Friends" + "Open Chat" button
  - "Request Pending" (disabled)

**Props:**
```javascript
<SearchBar 
  onUserFound={(user) => {}}
  onChatOpen={(conversationId) => {}}
/>
```

### 2. FriendRequestList Component
**Location:** `client/src/components/FriendRequestList.jsx`

**Features:**
- Display list of pending requests
- Show sender info (avatar, username)
- Accept/Decline buttons
- Real-time updates via socket
- Notification badge count

**Structure:**
```jsx
<div className="friend-requests">
  <h3>Friend Requests ({pendingCount})</h3>
  {requests.map(request => (
    <FriendRequestItem 
      request={request}
      onAccept={handleAccept}
      onDecline={handleDecline}
    />
  ))}
</div>
```

### 3. NotificationToast Component
**Location:** `client/src/components/NotificationToast.jsx`

**Features:**
- Real-time friend request notifications
- Custom styling with Tailwind
- Quick action buttons (Accept/Decline inline)
- Auto-dismiss after 10 seconds

---

## 🔄 User Flow Diagrams

### Flow 1: Search & Send Request
```
User A searches for User B by email
    ↓
System checks: email exists?
    ↓ No → "No user found"
    ↓ Yes
Check: already friends?
    ↓ No → Show "Send Request" button
    ↓ Yes → Show "Already Friends" + "Open Chat"
    ↓
User A clicks "Send Request"
    ↓
POST /api/friends/request
    ↓
Server creates FriendRequest (status: pending)
    ↓
Socket emit: friend_request_received → User B
    ↓
User B sees notification + sidebar item
```

### Flow 2: Accept Friend Request
```
User B receives notification
    ↓
User B clicks "Accept" in sidebar/notification
    ↓
POST /api/friends/accept/:requestId
    ↓
Server creates Friendship record
    ↓
Server creates DM Room (roomType: 'direct')
    ↓
Server creates system message:
  "Your journey with [User A] begins here 🎉"
    ↓
Socket emit: friend_request_accepted → User A
Socket emit: friendship_created → Both users
    ↓
Auto-redirect User B to conversation
    ↓
Both users can now DM each other
```

### Flow 3: Decline Friend Request
```
User B clicks "Decline"
    ↓
POST /api/friends/decline/:requestId
    ↓
Server updates FriendRequest (status: 'declined')
    ↓
Socket emit: friend_request_declined → User A
    ↓
Request removed from User B's list
User A can resend after 7 days (optional)
```

---

## 🎯 Key Features Implementation

### 1. Search User by Email
**File:** `server/controllers/friendController.js`

```javascript
exports.searchUserByEmail = async (req, res) => {
  const { email } = req.body;
  const currentUserId = req.user._id;
  
  // Find user by email
  const user = await User.findOne({ email }).select('-password');
  
  if (!user) {
    return res.json({ success: false, message: 'No user found' });
  }
  
  // Check if already friends
  const friendship = await Friendship.findOne({
    $or: [
      { user1: currentUserId, user2: user._id },
      { user1: user._id, user2: currentUserId }
    ]
  });
  
  if (friendship) {
    return res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        isFriend: true,
        conversationId: friendship.conversationRoom
      }
    });
  }
  
  // Check for pending request
  const pendingRequest = await FriendRequest.findOne({
    $or: [
      { sender: currentUserId, receiver: user._id, status: 'pending' },
      { sender: user._id, receiver: currentUserId, status: 'pending' }
    ]
  });
  
  res.json({
    success: true,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isFriend: false,
      hasPendingRequest: !!pendingRequest,
      requestSentByMe: pendingRequest?.sender.toString() === currentUserId.toString()
    }
  });
};
```

### 2. Send Friend Request
**File:** `server/controllers/friendController.js`

```javascript
exports.sendFriendRequest = async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user._id;
  
  // Validation
  if (senderId.toString() === receiverId) {
    return res.status(400).json({ error: 'Cannot send request to yourself' });
  }
  
  // Check if already friends
  const existingFriendship = await Friendship.findOne({
    $or: [
      { user1: senderId, user2: receiverId },
      { user1: receiverId, user2: senderId }
    ]
  });
  
  if (existingFriendship) {
    return res.status(400).json({ error: 'Already friends' });
  }
  
  // Check for existing pending request
  const existingRequest = await FriendRequest.findOne({
    $or: [
      { sender: senderId, receiver: receiverId, status: 'pending' },
      { sender: receiverId, receiver: senderId, status: 'pending' }
    ]
  });
  
  if (existingRequest) {
    return res.status(400).json({ error: 'Friend request already exists' });
  }
  
  // Create friend request
  const friendRequest = await FriendRequest.create({
    sender: senderId,
    receiver: receiverId,
    status: 'pending'
  });
  
  const populatedRequest = await FriendRequest.findById(friendRequest._id)
    .populate('sender', 'username avatar')
    .populate('receiver', 'username avatar');
  
  // Socket notification to receiver
  const io = req.app.get('io');
  const receiverUser = await User.findById(receiverId);
  
  if (receiverUser.socketId) {
    io.to(receiverUser.socketId).emit('friend_request_received', {
      requestId: friendRequest._id,
      sender: {
        _id: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar
      }
    });
  }
  
  res.status(201).json({
    success: true,
    message: 'Friend request sent',
    data: populatedRequest
  });
};
```

### 3. Accept Friend Request
**File:** `server/controllers/friendController.js`

```javascript
exports.acceptFriendRequest = async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;
  
  const friendRequest = await FriendRequest.findById(requestId)
    .populate('sender', 'username avatar')
    .populate('receiver', 'username avatar');
  
  if (!friendRequest) {
    return res.status(404).json({ error: 'Friend request not found' });
  }
  
  if (friendRequest.receiver._id.toString() !== userId.toString()) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  if (friendRequest.status !== 'pending') {
    return res.status(400).json({ error: 'Request already processed' });
  }
  
  // Create DM room
  const room = await Room.create({
    name: `DM: ${friendRequest.sender.username} & ${friendRequest.receiver.username}`,
    roomType: 'direct',
    creator: userId,
    members: [friendRequest.sender._id, friendRequest.receiver._id],
    admins: [friendRequest.sender._id, friendRequest.receiver._id]
  });
  
  // Create friendship
  const friendship = await Friendship.create({
    user1: friendRequest.sender._id,
    user2: friendRequest.receiver._id,
    conversationRoom: room._id
  });
  
  // Update friend request status
  friendRequest.status = 'accepted';
  await friendRequest.save();
  
  // Add to each user's friends list
  await User.findByIdAndUpdate(friendRequest.sender._id, {
    $addToSet: { friends: friendRequest.receiver._id }
  });
  await User.findByIdAndUpdate(friendRequest.receiver._id, {
    $addToSet: { friends: friendRequest.sender._id }
  });
  
  // Create system message
  await Message.create({
    sender: userId,
    room: room._id,
    content: `Your journey with ${friendRequest.sender.username} begins here 🎉`,
    messageType: 'system'
  });
  
  // Socket notifications
  const io = req.app.get('io');
  const senderUser = await User.findById(friendRequest.sender._id);
  
  if (senderUser.socketId) {
    io.to(senderUser.socketId).emit('friend_request_accepted', {
      requestId: friendRequest._id,
      acceptedBy: {
        _id: userId,
        username: req.user.username,
        avatar: req.user.avatar
      },
      conversationId: room._id
    });
    
    io.to(senderUser.socketId).emit('friendship_created', {
      friendshipId: friendship._id,
      friend: {
        _id: userId,
        username: req.user.username,
        avatar: req.user.avatar
      },
      conversationId: room._id
    });
  }
  
  res.json({
    success: true,
    message: 'Friend request accepted',
    data: {
      friendship,
      conversationId: room._id
    }
  });
};
```

### 4. Update Sidebar - Online Users Filter
**File:** `client/src/components/Sidebar.jsx`

```jsx
// Only show friends in online users
const onlineFriends = onlineUsers.filter(onlineUser => 
  user?.friends?.includes(onlineUser.userId) || onlineUser.userId === user?._id
);

// Display
<div className="online-users">
  <h3>Online Friends ({onlineFriends.length})</h3>
  {onlineFriends.map(friend => (
    <OnlineUserItem key={friend.userId} user={friend} />
  ))}
</div>
```

### 5. Last Seen in Direct Messages
**File:** `client/src/components/RoomHeader.jsx`

```jsx
const getLastSeenText = () => {
  if (!isDirect) return null;
  
  const friend = room.members.find(m => m._id !== user._id);
  
  if (friend.status === 'online') {
    return <span className="text-green-500">● Online</span>;
  }
  
  const lastSeen = formatRelativeTime(friend.lastSeen);
  return <span className="text-gray-500">Last seen {lastSeen}</span>;
};

// In render
{isDirect && (
  <div className="last-seen">
    {getLastSeenText()}
  </div>
)}
```

---

## 📱 Mobile Responsiveness

All new components must be mobile-friendly:

- SearchBar: Full-width on mobile, compact on desktop
- FriendRequestList: Stack vertically on mobile
- Notification toasts: Bottom-center on mobile
- Accept/Decline buttons: Full-width on mobile

---

## ✅ Testing Checklist

### Unit Tests
- [ ] FriendRequest model validation
- [ ] Friendship model creation
- [ ] friendController methods
- [ ] Socket event emissions

### Integration Tests
- [ ] Complete friend request flow
- [ ] Duplicate request prevention
- [ ] Self-request prevention
- [ ] Already friends check

### E2E Tests
- [ ] Search user by email
- [ ] Send friend request
- [ ] Receive notification (real-time)
- [ ] Accept request
- [ ] Auto-open chat
- [ ] System message appears
- [ ] Online status shows only friends
- [ ] Last seen in DMs
- [ ] Decline request

### Mobile Tests
- [ ] SearchBar on mobile (320px-768px)
- [ ] Friend requests on mobile
- [ ] Notifications on mobile
- [ ] Accept/decline flow on mobile

---

## 🚀 Deployment Steps

1. **Database Migration**
   - Add friends field to User collection
   - Create FriendRequest collection
   - Create Friendship collection
   - Add indexes

2. **Backend Deployment**
   - Deploy new models
   - Deploy friendController
   - Deploy friend routes
   - Update socket handlers

3. **Frontend Deployment**
   - Deploy SearchBar component
   - Deploy FriendRequestList component
   - Update ChatContext
   - Update Sidebar
   - Add socket listeners

4. **Testing**
   - Test on staging environment
   - Verify socket connections
   - Test mobile responsiveness
   - Load testing with multiple requests

5. **Go Live**
   - Deploy to production
   - Monitor socket events
   - Monitor error logs
   - Collect user feedback

---

## 📝 Implementation Order

### Phase 1: Backend (Server)
1. ✅ Create FriendRequest model
2. ✅ Create Friendship model  
3. ✅ Update User model
4. ✅ Create friendController
5. ✅ Create friend routes
6. ✅ Update socket handlers

### Phase 2: Frontend (Client)
7. ✅ Create SearchBar component
8. ✅ Create FriendRequestList component
9. ✅ Update ChatContext
10. ✅ Add socket listeners
11. ✅ Update Sidebar
12. ✅ Add last seen to DMs

### Phase 3: Testing & Polish
13. ✅ Add validation
14. ✅ Mobile responsiveness
15. ✅ Real-time notifications
16. ✅ End-to-end testing

---

## 🎨 UI/UX Considerations

### System Messages
When friendship is created, show:
> "🎉 Your journey with **[username]** begins here! Say hello and start chatting."

Alternative messages:
- "Your friendship with **[username]** starts now! 💬"
- "You and **[username]** are now friends! Start your conversation here. 🌟"
- "Welcome to your private space with **[username]**! ✨"

### Notification Styles
- Friend request received: Blue background, bell icon
- Request accepted: Green background, checkmark icon
- Request declined: Gray background, x icon

### Button States
- Send Request: Primary blue button
- Request Pending: Disabled gray button
- Already Friends: Green checkmark badge
- Accept: Green button
- Decline: Red text button

---

## 🔒 Security & Validation

### Backend Validation
- ✅ Cannot send request to self
- ✅ Cannot send duplicate requests
- ✅ Cannot send if already friends
- ✅ Rate limiting (max 10 requests per hour)
- ✅ Verify user ownership of requests
- ✅ Sanitize email input

### Frontend Validation
- ✅ Email format validation
- ✅ Debounced search (prevent spam)
- ✅ Disable buttons during API calls
- ✅ Show loading states
- ✅ Handle errors gracefully

---

## 📊 Performance Optimization

- Index on FriendRequest: `{ receiver: 1, status: 1 }`
- Index on Friendship: `{ user1: 1, user2: 1 }`
- Cache online friends list
- Lazy load friend requests
- Pagination for large friends lists
- Socket room optimization (only emit to relevant users)

---

This document serves as the complete blueprint for implementing the Friend Request feature. Follow the TODO list sequentially for systematic implementation.

