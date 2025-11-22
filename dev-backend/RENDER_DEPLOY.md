# Render Deployment Guide for StartupSeal Backend

## 🚀 Quick Deployment Steps:

### 1. Create Render Service
1. Go to [render.com](https://render.com) and sign up
2. Connect your GitHub repository
3. Create a **Web Service** (not Static Site)
4. Use these settings:
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `dev-backend`

### 2. Set Environment Variables on Render
Add these in the Render dashboard under "Environment Variables":

```
NODE_ENV=production
PORT=5000
WALRUS_API_URL=https://wal-aggregator-testnet.staketab.org
WALRUS_STORAGE_ENDPOINT=https://wal-publisher-testnet.staketab.org
NAUTILUS_PACKAGE_ID=0xe1df86bc99868f214f86951db2738bd2c46c47f2a4db6753f4fb98f681bef015
SUI_PACKAGE_ID=0xe1df86bc99868f214f86951db2738bd2c46c47f2a4db6753f4fb98f681bef015
SEAL_REGISTRY=0x1ca3cf4e05f04a3ae3fd0368cf97c81a4a9ac59c3479ab53d50eeaadf58b37f8
GOOGLE_VISION_API_KEY=AIzaSyBcTGbY30VA0hp5BonB9BKwjnST9QIaV9s
GITHUB_CLIENT_ID=Ov23liUJMzE0Sna7ya5c
GITHUB_CLIENT_SECRET=af4268bf3a099802a309abbbb9647432d6389224
```

### 3. Update Frontend URLs
After deployment, update your frontend code to use the Render backend URL:
- Your backend will be at: `https://your-service-name.onrender.com`
- Update `API_BASE_URL` in your frontend

### 4. Python Dependencies
Render supports Python! Add this file to your `dev-backend` folder:

**`requirements.txt`**:
```
numpy
pandas
scikit-learn
```

### 5. CORS Configuration
✅ Already configured in `src/server.js` to allow your frontend domain

## 🔧 Troubleshooting:

### Common Issues:
1. **Build fails**: Check Node version (should be 18+)
2. **Python not found**: Add `requirements.txt`
3. **CORS errors**: Update `corsOptions.origin` in `server.js`
4. **Port issues**: Render uses dynamic PORT env var (already handled)

### Health Check:
After deployment, test: `https://your-app.onrender.com/health`

## 📝 Post-Deployment:
1. Update frontend `utils/blockchain.js` with new backend URL
2. Test all API endpoints
3. Verify startup seal creation works
4. Check Fundraise page shows live data

Your app should be live in ~5 minutes! 🎉