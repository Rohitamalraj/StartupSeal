# StartupSeal Frontend - Mock Data Removal Analysis

## Summary of Changes Required

### ✅ COMPLETED:

1. **Created `src/utils/blockchain.js`**
   - Real Walrus storage functions (uploadToWalrus, downloadFromWalrus)
   - Backend API integration functions
   - getAllStartupSeals, getStartupSealById, searchStartupSeals, getLeaderboard
   - fetchCertificateData for Walrus blob retrieval

2. **Updated `src/store/useStore.js`**
   - Added fetchStartups() function
   - Added fetchLeaderboard() function
   - Moved mock data to _mockStartups (for reference only)
   - Added loading and error states
   - Added filter state management

3. **Updated `src/pages/ProfilePage.jsx`**
   - Fetch real startup data using getStartupSealById
   - Load certificates from Walrus using fetchCertificateData
   - Map blockchain data structure to display format
   - Show loading states with Loader2 spinner
   - Display blockchain verification details
   - Removed AI Report tab (mock data)
   - Added Blockchain Details tab with on-chain data

4. **Updated `src/pages/LeaderboardPage.jsx`** (Partial)
   - Added useEffect to fetch leaderboard on mount
   - Added filter-based re-fetching
   - Import loading/error states from store

### 🔨 REMAINING WORK:

1. **Complete `src/pages/LeaderboardPage.jsx`**
   - Add loading spinner component
   - Add error handling component  
   - Map blockchain data fields:
     ```javascript
     startup.overall_trust_score || startup.trust_score
     startup.startup_name || startup.name
     startup.hackathon_name || "N/A"
     startup.created_at || startup.timestamp
     startup.category || "DeFi"
     startup.hackathon_verified ? "✅" : "📋"
     ```

2. **Update `src/pages/FundraisePage.jsx`**
   - Remove mock fundraise data generation
   - Either:
     a) Remove fundraise feature entirely (not in blockchain contract)
     b) Create separate fundraise contract/backend
     c) Hide page until implementation ready

3. **Update `src/pages/HomePage.jsx`**
   - No changes needed (static marketing page)

4. **Update `src/pages/AboutPage.jsx`**
   - No changes needed (static info page)

5. **Install axios dependency**
   ```powershell
   npm install axios
   ```

## Backend API Endpoints Required

The frontend expects these endpoints from `http://localhost:8000`:

### Required (for current features):
```
GET  /api/seals/all                  # Get all startup seals
GET  /api/seals/:id                  # Get specific seal by object ID
GET  /api/seals/address/:address     # Get seals by wallet address
GET  /api/seals/search?q=query       # Search seals by name/repo
GET  /api/seals/leaderboard          # Get leaderboard (supports filters)
```

### Already Implemented:
```
POST /api/github/auth                # GitHub OAuth
POST /api/github/verify-repository   # Repository verification
```

## Blockchain Data Structure Mapping

### From Contract (startup_seal.move):
```rust
struct StartupSeal {
    startup_name: vector<u8>,
    hackathon_name: vector<u8>,
    github_repo: vector<u8>,
    certificate_blob_ids: vector<vector<u8>>,
    document_hash: vector<u8>,
    hackathon_score: u64,
    github_score: u64,
    ai_consistency_score: u64,
    document_score: u64,
    submission_hash: vector<u8>,
    nonce: u64,
    overall_trust_score: u64,
    hackathon_verified: bool,
    created_at: u64,
    owner: address
}
```

### To Frontend Display:
```javascript
{
  name: startup_name,
  hackathon: hackathon_name,
  githubRepo: github_repo,
  certificates: certificate_blob_ids,
  trustScore: overall_trust_score,
  hackathonScore: hackathon_score,
  githubScore: github_score,
  aiScore: ai_consistency_score,
  documentScore: document_score,
  verified: hackathon_verified,
  createdAt: created_at,
  owner: owner,
  category: "DeFi" // Default or from external source
  riskLevel: score >= 85 ? "low" : score >= 70 ? "medium" : "high"
}
```

## Features Removed (Mock Data):

1. **AI Report Tab** - Removed from ProfilePage
   - aiReport.summary
   - aiReport.strengths
   - aiReport.weaknesses
   - aiReport.redFlags
   - aiReport.successLikelihood

2. **Timeline Events** - Now auto-generated from blockchain data
   - Only shows: Seal Minted, Hackathon Verified, GitHub Verified

3. **Community/Team Scores** - Not in contract
   - startup.onChainScore
   - startup.teamScore
   - startup.communityScore

4. **Static Logos** - Replaced with emoji indicators
   - ✅ for verified
   - 📋 for unverified

## Next Steps

1. **Install Dependencies**:
   ```powershell
   cd c:\Users\thame\nautilus\StartupSeal\frontend
   npm install axios
   ```

2. **Create Backend API Endpoints** in `nautilus-agent/server.py`:
   - Add Sui blockchain query functions
   - Implement /api/seals/* endpoints
   - Parse StartupSeal objects from blockchain

3. **Test Integration**:
   - Start backend: `cd nautilus-agent; python server.py`
   - Start frontend: `npm run dev` (after Node.js upgrade)
   - Submit a test startup via /verify
   - Check if it appears in /leaderboard
   - View details in /profile/:id

4. **Handle Edge Cases**:
   - Empty leaderboard (no seals yet)
   - Failed Walrus downloads
   - Missing certificate blobs
   - Invalid seal IDs in URL

## File Changes Summary

| File | Status | Changes |
|------|--------|---------|
| `src/utils/blockchain.js` | ✅ Created | Walrus + API integration |
| `src/store/useStore.js` | ✅ Updated | Real data fetching |
| `src/pages/VerifyPage.jsx` | ✅ Complete | Already integrated |
| `src/pages/ProfilePage.jsx` | ✅ Updated | Real blockchain data |
| `src/pages/LeaderboardPage.jsx` | 🔨 Partial | Needs completion |
| `src/pages/FundraisePage.jsx` | ⚠️ Pending | Remove or implement |
| `src/pages/HomePage.jsx` | ✅ No changes | Static page |
| `src/pages/AboutPage.jsx` | ✅ No changes | Static page |
| `package.json` | ⚠️ Pending | Add axios |

## Current Blockers

1. **Node.js Version**: v22.10.0 → needs v22.12+
2. **Backend API**: Seal endpoints not yet implemented
3. **axios**: Not installed yet
4. **Testing**: Cannot run `npm run dev` until Node.js upgraded

Once Node.js is upgraded and axios is installed, the frontend will be fully functional with real blockchain data (pending backend API implementation).
