# 🔐 Environment Variables Quick Reference

## 📋 Overview

This document provides a complete reference for all environment variables used in the Real-Time Chat Application.

---

## 🖥️ Server Environment Variables

### Required Variables

#### `MONGODB_URI`
- **Description**: MongoDB Atlas connection string
- **Type**: String (URI)
- **Required**: ✅ Yes
- **Example**: `mongodb+srv://username:password@cluster.mongodb.net/chatapp`
- **Development**: Local MongoDB or MongoDB Atlas
- **Production**: MongoDB Atlas (recommended)
- **How to get**:
  1. Create MongoDB Atlas cluster
  2. Create database user
  3. Get connection string from "Connect" button
  4. Replace `<username>` and `<password>`
  5. Add database name at the end

#### `JWT_SECRET`
- **Description**: Secret key for signing JWT tokens
- **Type**: String
- **Required**: ✅ Yes
- **Example**: `7f8a9b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`
- **Development**: Any string (min 32 chars)
- **Production**: Strong random string (min 32 chars)
- **Generate**:
  ```bash
  # macOS/Linux
  openssl rand -base64 32
  
  # Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- **Security**: Never commit to git, rotate periodically

#### `CLIENT_URL`
- **Description**: Frontend application URL for CORS
- **Type**: String (URL)
- **Required**: ✅ Yes
- **Development**: `http://localhost:5173`
- **Production**: `https://your-app.vercel.app`
- **Note**: Must match exact URL (no trailing slash)

### Optional Variables (with defaults)

#### `PORT`
- **Description**: Server port number
- **Type**: Number
- **Required**: ❌ No
- **Default**: `5000`
- **Development**: `5000`
- **Production**: Render sets to `10000` automatically
- **Range**: `1024-65535`

#### `NODE_ENV`
- **Description**: Application environment
- **Type**: String (enum)
- **Required**: ❌ No
- **Default**: `development`
- **Values**: `development`, `production`, `test`
- **Development**: `development`
- **Production**: `production`

#### `JWT_EXPIRE`
- **Description**: JWT token expiration time
- **Type**: String (time unit)
- **Required**: ❌ No
- **Default**: `7d`
- **Examples**: `1h`, `24h`, `7d`, `30d`
- **Recommended**: `7d` (7 days)

#### `MAX_FILE_SIZE`
- **Description**: Maximum file upload size in bytes
- **Type**: Number
- **Required**: ❌ No
- **Default**: `5242880` (5MB)
- **Examples**:
  - 1MB: `1048576`
  - 5MB: `5242880`
  - 10MB: `10485760`
- **Note**: Consider server limits

#### `UPLOAD_PATH`
- **Description**: Directory for file uploads
- **Type**: String (path)
- **Required**: ❌ No
- **Default**: `./uploads`
- **Development**: `./uploads`
- **Production**: `./uploads` (ephemeral on Render)
- **Note**: Use cloud storage (S3, Cloudinary) for production

#### `SOCKET_PING_TIMEOUT`
- **Description**: Socket.io ping timeout in milliseconds
- **Type**: Number
- **Required**: ❌ No
- **Default**: `60000` (60 seconds)
- **Range**: `10000-120000`

#### `SOCKET_PING_INTERVAL`
- **Description**: Socket.io ping interval in milliseconds
- **Type**: Number
- **Required**: ❌ No
- **Default**: `25000` (25 seconds)
- **Range**: `5000-60000`

---

## 🌐 Client Environment Variables

All client variables must be prefixed with `VITE_` to be exposed to the browser.

### Required Variables

#### `VITE_API_URL`
- **Description**: Backend API base URL
- **Type**: String (URL)
- **Required**: ✅ Yes
- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-app.onrender.com/api`
- **Note**: Must include `/api` suffix

#### `VITE_SOCKET_URL`
- **Description**: Socket.io server URL
- **Type**: String (URL)
- **Required**: ✅ Yes
- **Development**: `http://localhost:5000`
- **Production**: `https://your-app.onrender.com`
- **Note**: NO `/api` suffix

### Optional Variables

#### `VITE_APP_NAME`
- **Description**: Application display name
- **Type**: String
- **Required**: ❌ No
- **Default**: `Real-Time Chat App`
- **Example**: `My Awesome Chat`

#### `VITE_NODE_ENV`
- **Description**: Frontend environment mode
- **Type**: String (enum)
- **Required**: ❌ No
- **Default**: `development`
- **Values**: `development`, `production`
- **Note**: Auto-set by Vite in most cases

---

## 📝 Configuration Examples

### Development Environment

#### Server `.env`
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://devuser:devpass@cluster.mongodb.net/chatapp-dev

# Authentication
JWT_SECRET=dev-secret-key-min-32-chars-please-change-in-production
JWT_EXPIRE=7d

# CORS
CLIENT_URL=http://localhost:5173

# File Uploads
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Socket.io
SOCKET_PING_TIMEOUT=60000
SOCKET_PING_INTERVAL=25000
```

#### Client `.env`
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# App Configuration
VITE_APP_NAME=Real-Time Chat App (Dev)
VITE_NODE_ENV=development
```

### Production Environment

#### Server (Render Dashboard)
```env
# Server Configuration
PORT=10000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://produser:strongpass@cluster.mongodb.net/chatapp-prod

# Authentication
JWT_SECRET=7f8a9b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_EXPIRE=7d

# CORS
CLIENT_URL=https://my-chat-app.vercel.app

# File Uploads
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Socket.io
SOCKET_PING_TIMEOUT=60000
SOCKET_PING_INTERVAL=25000
```

#### Client (Vercel Dashboard)
```env
# API Configuration
VITE_API_URL=https://my-chat-server.onrender.com/api
VITE_SOCKET_URL=https://my-chat-server.onrender.com

# App Configuration
VITE_APP_NAME=Real-Time Chat App
VITE_NODE_ENV=production
```

---

## 🔒 Security Best Practices

### DO ✅

1. **Use strong secrets**
   - Minimum 32 characters for `JWT_SECRET`
   - Use random generation tools
   - Different secrets for dev/prod

2. **Never commit secrets**
   - Add `.env` to `.gitignore`
   - Use `.env.example` for templates
   - Document variable names only

3. **Restrict CORS**
   - Set exact `CLIENT_URL` in production
   - Don't use wildcards (`*`)
   - Add multiple URLs if needed

4. **Rotate secrets**
   - Change `JWT_SECRET` periodically
   - Update database passwords
   - Use secret management tools

5. **Use environment-specific databases**
   - Separate dev/prod databases
   - Different credentials for each
   - Backup production data

### DON'T ❌

1. **Never hardcode secrets**
   ```javascript
   // ❌ Bad
   const JWT_SECRET = 'my-secret-key';
   
   // ✅ Good
   const JWT_SECRET = process.env.JWT_SECRET;
   ```

2. **Never commit `.env` files**
   ```bash
   # ✅ Good - in .gitignore
   .env
   .env.local
   .env.production
   ```

3. **Never use weak secrets**
   ```env
   # ❌ Bad
   JWT_SECRET=secret123
   
   # ✅ Good
   JWT_SECRET=7f8a9b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
   ```

4. **Never share production credentials**
   - Use separate dev credentials
   - Limit access to production secrets
   - Use secret management services

---

## 🛠️ Troubleshooting

### Common Issues

#### "Cannot connect to database"
- ✅ Check `MONGODB_URI` format
- ✅ Verify username/password are correct
- ✅ Ensure MongoDB Atlas network access allows your IP
- ✅ Check if cluster is active

#### "JWT malformed" errors
- ✅ Verify `JWT_SECRET` is set
- ✅ Ensure secret is at least 32 characters
- ✅ Check if token is being sent in Authorization header
- ✅ Clear localStorage and re-login

#### "CORS policy" errors
- ✅ Check `CLIENT_URL` matches exact frontend URL
- ✅ Remove trailing slashes from URLs
- ✅ Verify CORS middleware is configured
- ✅ Check if origin is in allowed list

#### "Cannot connect to Socket.io"
- ✅ Verify `VITE_SOCKET_URL` is correct
- ✅ Ensure no `/api` suffix on socket URL
- ✅ Check backend Socket.io CORS config
- ✅ Verify WebSocket connections are allowed

#### "File upload failed"
- ✅ Check file size against `MAX_FILE_SIZE`
- ✅ Verify upload directory exists
- ✅ Check file type validation
- ✅ Ensure backend has write permissions

---

## 📚 Additional Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [MongoDB Atlas Connection Strings](https://docs.atlas.mongodb.com/driver-connection/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [CORS Configuration](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Socket.io Configuration](https://socket.io/docs/v4/server-options/)

---

## 🎯 Quick Setup Checklist

### Server Setup
- [ ] Copy `server/.env.example` to `server/.env`
- [ ] Set `MONGODB_URI` from MongoDB Atlas
- [ ] Generate and set strong `JWT_SECRET`
- [ ] Set `CLIENT_URL` to your frontend URL
- [ ] Verify other defaults are acceptable

### Client Setup
- [ ] Copy `client/.env.example` to `client/.env`
- [ ] Set `VITE_API_URL` to backend URL + `/api`
- [ ] Set `VITE_SOCKET_URL` to backend URL (no `/api`)
- [ ] Optionally customize `VITE_APP_NAME`

### Deployment
- [ ] Add all server variables to Render dashboard
- [ ] Add all client variables to Vercel dashboard
- [ ] Update `CLIENT_URL` in Render after Vercel deployment
- [ ] Test all environment-dependent features

---

**Last Updated:** November 24, 2025  
**Version:** 1.0.0
