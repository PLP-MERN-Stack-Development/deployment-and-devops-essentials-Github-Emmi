# 🚀 Deployment Guide - Real-Time Chat Application

This guide will walk you through deploying your chat application to production using **Render** (backend) and **Vercel** (frontend).

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- ✅ All code committed to GitHub
- ✅ MongoDB Atlas database set up (free tier available)
- ✅ Render account created ([render.com](https://render.com))
- ✅ Vercel account created ([vercel.com](https://vercel.com))
- ✅ Node.js environment understanding
- ✅ Environment variables documented

---

## 🗄️ Step 1: Set Up MongoDB Atlas (Database)

### 1.1 Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (M0 Free Tier)
4. Wait for cluster to provision (2-5 minutes)

### 1.2 Configure Database Access

1. Click **Database Access** in left sidebar
2. Click **Add New Database User**
3. Create username and password (save these!)
4. Set privileges to **Read and write to any database**
5. Click **Add User**

### 1.3 Configure Network Access

1. Click **Network Access** in left sidebar
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (0.0.0.0/0)
   - *For production, restrict to your server IP*
4. Click **Confirm**

### 1.4 Get Connection String

1. Click **Database** in left sidebar
2. Click **Connect** on your cluster
3. Select **Connect your application**
4. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your credentials
6. Add database name: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/chatapp?retryWrites=true&w=majority`

---

## 🖥️ Step 2: Deploy Backend to Render

### 2.1 Create Render Account

1. Go to [Render](https://render.com)
2. Sign up with GitHub (recommended)
3. Authorize Render to access your repositories

### 2.2 Create New Web Service

1. Click **New +** button
2. Select **Web Service**
3. Connect your GitHub repository
4. Select your chat app repository

### 2.3 Configure Web Service

Fill in the following settings:

**Basic Settings:**
- **Name**: `socketio-chat-server` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `server`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Type:**
- Select **Free** tier (or paid if needed)

### 2.4 Add Environment Variables

Click **Advanced** and add these environment variables:

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `your-super-secret-key-min-32-chars` | Strong random string (use password generator) |
| `JWT_EXPIRE` | `7d` | Token expiration time |
| `CLIENT_URL` | `https://your-app.vercel.app` | Your Vercel frontend URL (add after deploying frontend) |
| `PORT` | `10000` | Port number (Render default) |
| `MAX_FILE_SIZE` | `5242880` | 5MB file upload limit |
| `UPLOAD_PATH` | `./uploads` | Upload directory |
| `SOCKET_PING_TIMEOUT` | `60000` | Socket timeout |
| `SOCKET_PING_INTERVAL` | `25000` | Socket ping interval |

**Important Notes:**
- For `JWT_SECRET`: Use a strong random string (min 32 characters)
  ```bash
  # Generate on macOS/Linux:
  openssl rand -base64 32
  ```
- For `CLIENT_URL`: Leave as `http://localhost:5173` initially, update after Vercel deployment

### 2.5 Deploy Backend

1. Click **Create Web Service**
2. Wait for deployment (3-5 minutes)
3. Watch build logs for any errors
4. Once deployed, you'll get a URL like: `https://socketio-chat-server.onrender.com`

### 2.6 Test Backend Deployment

Open your backend URL in browser:
```
https://your-app-name.onrender.com
```

You should see:
```json
{
  "message": "Socket.io Chat Server is running",
  "version": "1.0.0",
  "status": "active"
}
```

Test health endpoint:
```
https://your-app-name.onrender.com/health
```

---

## 🌐 Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account

1. Go to [Vercel](https://vercel.com)
2. Sign up with GitHub (recommended)
3. Authorize Vercel to access your repositories

### 3.2 Import Project

1. Click **Add New** → **Project**
2. Import your GitHub repository
3. Vercel will auto-detect it's a Vite project

### 3.3 Configure Project Settings

**Framework Preset:**
- Should auto-detect as **Vite**

**Root Directory:**
- Set to `client`

**Build Settings:**
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.4 Add Environment Variables

Click **Environment Variables** and add:

| Key | Value | Description |
|-----|-------|-------------|
| `VITE_API_URL` | `https://your-render-app.onrender.com/api` | Your Render backend URL + /api |
| `VITE_SOCKET_URL` | `https://your-render-app.onrender.com` | Your Render backend URL (no /api) |
| `VITE_APP_NAME` | `Real-Time Chat App` | Application name |
| `VITE_NODE_ENV` | `production` | Environment mode |

**Example:**
```env
VITE_API_URL=https://socketio-chat-server.onrender.com/api
VITE_SOCKET_URL=https://socketio-chat-server.onrender.com
VITE_APP_NAME=Real-Time Chat App
VITE_NODE_ENV=production
```

### 3.5 Deploy Frontend

1. Click **Deploy**
2. Wait for build and deployment (2-3 minutes)
3. Watch build logs for any errors
4. Once deployed, you'll get a URL like: `https://your-app.vercel.app`

---

## 🔄 Step 4: Update Backend with Frontend URL

### 4.1 Update Render Environment Variable

1. Go to your Render dashboard
2. Click on your web service
3. Go to **Environment** tab
4. Update `CLIENT_URL` with your Vercel URL:
   ```
   https://your-app.vercel.app
   ```
5. Click **Save Changes**
6. Render will automatically redeploy

---

## ✅ Step 5: Verify Deployment

### 5.1 Test Backend

Open browser dev tools and visit:
```
https://your-render-app.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 5.2 Test Frontend

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Open browser console (F12)
3. Register a new account
4. Check console for successful API calls
5. Check for Socket.io connection: `✅ Connected to server: <socket-id>`

### 5.3 Test Full Flow

1. **Register**: Create a new account
2. **Login**: Sign in with credentials
3. **Send Message**: Type and send a message
4. **Real-time**: Open in another browser/incognito window
5. **Verify**: Both users should see messages in real-time

---

## 🐛 Troubleshooting

### Backend Issues

**Problem: "Application failed to respond"**
- Check Render logs for errors
- Verify `MONGODB_URI` is correct
- Ensure MongoDB Atlas allows connections from anywhere

**Problem: "JWT malformed" or "Authentication failed"**
- Verify `JWT_SECRET` is set
- Clear localStorage in browser
- Re-register/login

**Problem: MongoDB connection timeout**
- Check MongoDB Atlas network access
- Verify connection string format
- Ensure username/password are correct

### Frontend Issues

**Problem: "Cannot connect to server"**
- Verify `VITE_API_URL` and `VITE_SOCKET_URL` are correct
- Check if backend is running
- Open browser console for errors

**Problem: "CORS error"**
- Update `CLIENT_URL` in Render
- Verify backend CORS configuration
- Check if URLs match exactly (no trailing slashes)

**Problem: "Failed to load resource"**
- Check Network tab in browser dev tools
- Verify API endpoints are correct
- Ensure backend is deployed

### Socket.io Issues

**Problem: Socket connection fails**
- Check browser console for connection errors
- Verify `VITE_SOCKET_URL` matches backend URL
- Check if backend allows WebSocket connections

**Problem: Messages not appearing in real-time**
- Check if Socket.io connected in console
- Verify both users are in the same room
- Check backend logs for errors

---

## 🔒 Security Recommendations

### For Production

1. **Environment Variables**
   - Use strong, unique `JWT_SECRET` (32+ characters)
   - Never commit `.env` files to git
   - Rotate secrets periodically

2. **MongoDB**
   - Restrict IP addresses (not 0.0.0.0/0)
   - Use strong database passwords
   - Enable MongoDB encryption at rest

3. **CORS**
   - Set specific frontend URLs only
   - Don't allow all origins in production
   - Update `CLIENT_URL` to exact domain

4. **Rate Limiting**
   - Consider adding express-rate-limit
   - Limit login attempts
   - Throttle API requests

5. **File Uploads**
   - Validate file types strictly
   - Limit file sizes
   - Scan uploads for malware (production)
   - Use cloud storage (AWS S3, Cloudinary)

---

## 📊 Monitoring & Logs

### Render Logs

1. Go to Render dashboard
2. Click your web service
3. Click **Logs** tab
4. Monitor real-time logs

### Vercel Logs

1. Go to Vercel dashboard
2. Click your project
3. Click **Deployments**
4. Click on a deployment → **View Function Logs**

---

## 🔄 Continuous Deployment

Both Render and Vercel support automatic deployments:

1. **Push to GitHub**: Commit and push changes to `main` branch
2. **Auto Deploy**: Both platforms detect changes and redeploy
3. **Monitor**: Check deployment status in dashboards
4. **Rollback**: If issues occur, rollback to previous deployment

---

## 💰 Cost Optimization

### Free Tier Limits

**Render (Free):**
- 750 hours/month
- Sleeps after 15 min of inactivity
- Wakes on request (cold start ~30 seconds)
- 512 MB RAM

**Vercel (Free):**
- 100 GB bandwidth/month
- Unlimited deployments
- Serverless functions

### Tips

1. **Prevent Sleep**: Use uptime monitoring (UptimeRobot, Pingdom)
2. **Optimize**: Reduce bundle size, enable compression
3. **CDN**: Vercel provides global CDN automatically
4. **Database**: MongoDB Atlas free tier (512 MB storage)

---

## 📚 Additional Resources

### Documentation

- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
- [Socket.io Docs](https://socket.io/docs/v4/)

### Monitoring Tools

- [UptimeRobot](https://uptimerobot.com) - Free uptime monitoring
- [Sentry](https://sentry.io) - Error tracking
- [LogRocket](https://logrocket.com) - Session replay

### Performance

- [Google PageSpeed Insights](https://pagespeed.web.dev)
- [WebPageTest](https://www.webpagetest.org)
- [GTmetrix](https://gtmetrix.com)

---

## 🎉 Deployment Complete!

Your real-time chat application is now live in production!

**Backend**: `https://your-app.onrender.com`  
**Frontend**: `https://your-app.vercel.app`

### Next Steps

1. ✅ Share your app with friends
2. ✅ Add custom domain (Vercel supports this)
3. ✅ Set up monitoring and alerts
4. ✅ Add analytics (Google Analytics, Plausible)
5. ✅ Implement additional features
6. ✅ Add to your portfolio

---

## 📞 Support

If you encounter issues:

1. Check deployment logs
2. Review environment variables
3. Test backend health endpoint
4. Verify frontend can reach backend
5. Check browser console for errors
6. Review this guide's troubleshooting section

---

**Built with ❤️ for PLP MERN Stack Development Program**

*Happy Deploying! 🚀*
