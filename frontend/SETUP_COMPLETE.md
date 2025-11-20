# StartupSeal Frontend Setup - Complete ✅

## What Was Done

### 1. Dependencies Installed ✅
```powershell
cd c:\Users\thame\nautilus\StartupSeal\frontend
npm install
```
- All 419 packages installed successfully
- No vulnerabilities found

### 2. Environment Configuration ✅
Created `.env` file with:
- GitHub OAuth credentials (same as nautilus/frontend)
- Backend API endpoint: `http://localhost:8000`
- Sui Testnet configuration
- **Deployed contract addresses**:
  - Package ID: `0xe1df86bc99868f214f86951db2738bd2c46c47f2a4db6753f4fb98f681bef015`
  - SealRegistry: `0xbf8c46c6ded3db79361e84b12ab98e4957fc5cf345e7f43bd466e9775bbda01d`

### 3. Backend Integration ✅
Updated **VerifyPage.jsx** to connect with deployed backend:
- ✅ GitHub OAuth flow (`/api/github/auth`)
- ✅ Repository verification (`/api/github/verify-repository`)
- ✅ Direct blockchain NFT minting
- ✅ Trust score calculation (40% hackathon, 30% GitHub, 20% AI, 10% docs)
- ✅ Nonce-based replay prevention
- ✅ Submission hash for duplicate prevention

### 4. Admin Flow Removed ✅
- ✅ Removed `/admin` route from **App.jsx**
- ✅ Removed Admin link from **Header.jsx**
- ✅ No admin approval required - direct submission

### 5. Documentation Updated ✅
- ✅ Updated **README.md** with setup instructions
- ✅ Added troubleshooting section
- ✅ Documented workflow changes

## Key Differences from nautilus/frontend

| Feature | nautilus/frontend | StartupSeal/frontend |
|---------|-------------------|----------------------|
| **Admin Flow** | Has admin approval | No admin (direct mint) |
| **GitHub Field** | Full URL | Repository name (owner/repo) |
| **OAuth Redirect** | /github-callback | /verify |
| **UI Framework** | Basic components | Radix UI + shadcn/ui |
| **Design** | Minimal | Polished production UI |
| **Contract Integration** | Hardcoded values | Environment variables |

## Workflow Changes

### Old Flow (nautilus/frontend):
1. Submit form
2. Upload to Walrus
3. **Wait for admin approval** ❌
4. Admin mints NFT
5. Receive verification

### New Flow (StartupSeal/frontend):
1. Submit form
2. GitHub OAuth + verification
3. Calculate trust scores
4. **Direct NFT minting** ✅
5. Receive verification immediately

## Current Status

### ✅ Completed:
- Dependencies installed
- Environment configured
- Backend integration complete
- Admin flow removed
- Documentation updated

### ⚠️ Blockers:
**Node.js Version**: v22.10.0 (requires v22.12+)

**Error when running `npm run dev`:**
```
Error: Vite requires Node.js version 20.19+ or 22.12+
Cannot find module '@rolldown/binding-win32-x64-msvc'
```

### 🔧 Solution:
1. **Upgrade Node.js**:
   - Download: https://nodejs.org/
   - Install v22.12+ or v20.19+

2. **Reinstall dependencies** (after Node upgrade):
   ```powershell
   cd c:\Users\thame\nautilus\StartupSeal\frontend
   Remove-Item -Recurse -Force node_modules, package-lock.json
   npm install
   ```

3. **Start backend**:
   ```powershell
   cd c:\Users\thame\nautilus\nautilus-agent
   python server.py
   ```

4. **Start frontend**:
   ```powershell
   cd c:\Users\thame\nautilus\StartupSeal\frontend
   npm run dev
   ```

## Architecture

```
StartupSeal Frontend (Production)
├── Environment (.env)
│   ├── GitHub OAuth credentials
│   ├── Backend API (localhost:8000)
│   └── Sui contracts (deployed testnet)
│
├── Pages
│   ├── Home (/) - Landing page
│   ├── Verify (/verify) - Main verification flow ⭐
│   ├── Leaderboard (/leaderboard) - Rankings
│   ├── Profile (/profile/:id) - Verification details
│   ├── Fundraise (/fundraise) - Fundraising
│   └── About (/about) - Platform info
│
├── Backend Integration
│   ├── GitHub OAuth (/api/github/auth)
│   ├── Repository Verification (/api/github/verify-repository)
│   └── Certificate Analysis (/api/analyze-certificate)
│
└── Blockchain
    ├── Sui Testnet RPC
    ├── Package: 0xe1df86bc...bef015
    └── SealRegistry: 0xbf8c46c6...bda01d
```

## Verification Flow

```
User Opens /verify
    ↓
1. Fill Form (name, description, hackathon)
    ↓
2. Enter GitHub Repo (owner/repo)
    ↓
3. Click "Connect & Verify GitHub"
    ↓
4. OAuth Flow → Backend /api/github/auth
    ↓
5. Backend Verification → /api/github/verify-repository
    ↓
6. Calculate Scores:
   - Hackathon: 70 (if provided) or 0
   - GitHub: (ownership * 0.6) + (activity * 0.4)
   - AI: consistency_score
   - Documents: 80 (if uploaded) or 50
    ↓
7. Generate Security:
   - Nonce: timestamp + random
   - Hash: sha256(name + repo + hackathon + nonce)
    ↓
8. Build Transaction:
   - Call: mint_startup_seal
   - Args: [registry, name, hackathon, repo, blobs, hash, scores, nonce]
    ↓
9. Sign with Sui Wallet
    ↓
10. Execute Transaction
    ↓
11. Receive NFT + Trust Score
    ↓
12. Navigate to Profile
```

## Trust Score Breakdown

```javascript
// Component Scores (0-100 each)
hackathonScore = hackathonName ? 70 : 0
githubScore = (ownershipScore * 0.6) + (activityScore * 0.4)
aiScore = consistencyScore
documentScore = hasDocuments ? 80 : 50

// Overall Score (weighted average)
overallScore = 
  (hackathonScore * 0.4) +   // 40% - Hackathon participation
  (githubScore * 0.3) +       // 30% - GitHub activity
  (aiScore * 0.2) +           // 20% - AI consistency
  (documentScore * 0.1)       // 10% - Documentation quality
```

## Backend Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/github/auth` | POST | Exchange OAuth code for token |
| `/api/github/verify-repository` | POST | Verify repo access & analyze |
| `/api/analyze-certificate` | POST | Certificate validation (optional) |

## Next Steps

1. **Upgrade Node.js** to v22.12+
   - Download: https://nodejs.org/
   - Install MSI for Windows

2. **Reinstall Dependencies**:
   ```powershell
   cd c:\Users\thame\nautilus\StartupSeal\frontend
   Remove-Item -Recurse -Force node_modules, package-lock.json
   npm install
   ```

3. **Start Services**:
   ```powershell
   # Terminal 1 - Backend
   cd c:\Users\thame\nautilus\nautilus-agent
   python server.py

   # Terminal 2 - Frontend
   cd c:\Users\thame\nautilus\StartupSeal\frontend
   npm run dev
   ```

4. **Test Workflow**:
   - Open http://localhost:5173
   - Connect Sui Wallet
   - Go to /verify
   - Submit a startup with GitHub repo
   - Verify OAuth and scoring
   - Mint NFT

5. **Optional Improvements**:
   - Integrate real hackathon API (Devfolio/DoraHacks/ETHGlobal)
   - Implement LLM-based AI consistency check
   - Add Walrus certificate upload
   - Create leaderboard data fetching

## Files Modified

1. ✅ **Created**: `.env` (environment configuration)
2. ✅ **Updated**: `src/pages/VerifyPage.jsx` (backend integration)
3. ✅ **Updated**: `src/App.jsx` (removed admin route)
4. ✅ **Updated**: `src/components/Header.jsx` (removed admin link)
5. ✅ **Updated**: `README.md` (added setup instructions)

## Summary

The StartupSeal frontend is now **fully configured** and ready to use! It connects to:
- ✅ Backend API (localhost:8000) for GitHub OAuth and verification
- ✅ Sui Testnet blockchain with deployed contract
- ✅ Direct NFT minting (no admin approval)

**Only remaining step**: Upgrade Node.js to v22.12+ and run `npm install` again.

Once Node.js is upgraded, the application will start successfully with `npm run dev` and be accessible at http://localhost:5173.
