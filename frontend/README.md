# StartupSeal Frontend - Production

A provably authentic trust engine for Web3 hackathon startups, featuring AI-driven credibility scoring, on-chain verification, and direct NFT minting.

## Prerequisites

- **Node.js**: v20.19+ or v22.12+ (you currently have v22.10.0, **please upgrade**)
- **Sui Wallet**: Browser extension installed
- **Backend API**: Running on `http://localhost:8000`

## Quick Start

### 1. Upgrade Node.js (if needed)
Download from: https://nodejs.org/ (install v22.12+)

### 2. Install Dependencies
```powershell
npm install
```

If you encounter native binding errors:
```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

### 3. Start Backend
```powershell
cd c:\Users\thame\nautilus\nautilus-agent
python server.py
```

### 4. Start Frontend
```powershell
npm run dev
```

### 5. Open Browser
Navigate to: http://localhost:5173

## Environment Configuration

The `.env` file is pre-configured with:
- GitHub OAuth credentials
- Sui Testnet RPC URL
- Deployed contract addresses (Package ID, SealRegistry)
- Backend API endpoint (localhost:8000)

**No changes needed** - ready to use!

## 🚀 Features

### Core Functionality
- **AI-Powered Trust Scores** - Advanced ML algorithms analyze multiple data points
- **On-chain Verification** - Immutable proof of hackathon participation and deployments
- **Hackathon Provenance** - Verifiable certificates via Nautilus integration
- **Team Identity Verification** - Zero-knowledge proofs for team authenticity
- **Risk Assessment** - Comprehensive risk flags and red flag detection
- **GitHub Analysis** - Repository authenticity and commit provenance checks

### Pages & Components

#### 1. Landing Page
- Modern hero section with call-to-action
- Feature cards showcasing key capabilities
- "Why Authenticity Matters" section
- Statistics showcase
- Responsive design

#### 2. Startup Verification
- Search by name, contract address, or GitHub
- Hackathon selection dropdown
- Document upload (PDFs, pitch decks, images)
- Real-time trust score generation

#### 3. Startup Profile
- **Header Card**: Logo, name, category, trust score circle
- **Trust Score Breakdown**: 6 component scores with progress bars
- **Provenance Timeline**: Visual timeline of key events
- **AI Report**: Comprehensive analysis with strengths, weaknesses, success prediction

#### 4. Leaderboard
- Sortable table with filters
- Responsive card view for mobile
- Real-time rankings

#### 5. Admin Dashboard
- Upload hackathon certificate schemas
- Manage verifiable credentials
- Review flagged startups
- Re-run AI analysis

#### 6. About Page
- Mission statement
- How it works
- Trust score breakdown

## 🎨 Design System

Matches the Brillance SaaS design:
- **Colors**: OKLCH color space
- **Typography**: Inter + Instrument Serif
- **Theme**: Light mode with #f7f5f3 background

## 🛠️ Tech Stack

- React 19 + Vite
- React Router DOM
- Tailwind CSS 4.x
- Lucide Icons
- Zustand (State)
- Framer Motion

## 📦 Installation

```bash
npm install
npm run dev
```

## 🗂️ Project Structure

```
src/
├── components/ui/    # Reusable UI components
├── pages/            # All route pages
├── store/            # Zustand store with mock data
└── lib/              # Utilities
```

## 🎯 Mock Data

Includes 5 sample startups with complete trust scores, timelines, and AI reports.

## 🚦 Next Steps (Backend Integration)

1. Replace mock data with API calls
2. Implement file upload to IPFS/Arweave
3. Connect wallet integration
4. Integrate on-chain data fetching
5. Connect AI analysis service

---

Built for the Web3 ecosystem 🚀
