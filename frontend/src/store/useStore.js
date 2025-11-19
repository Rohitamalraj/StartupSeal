import { create } from 'zustand'

export const useStore = create((set) => ({
  // Mock startups data
  startups: [
    {
      id: 1,
      name: "DeFiChain Protocol",
      logo: "🔷",
      category: "DeFi",
      hackathon: "ETHGlobal Istanbul 2024",
      trustScore: 92,
      onChainScore: 95,
      teamScore: 90,
      githubScore: 88,
      communityScore: 93,
      documentScore: 94,
      riskLevel: "low",
      lastVerified: "2024-11-15",
      description: "Decentralized lending protocol with cross-chain capabilities",
      timeline: [
        { date: "2024-10-01", event: "Hackathon Submission", type: "submission" },
        { date: "2024-10-15", event: "Smart Contract Deployed", type: "deployment" },
        { date: "2024-10-20", event: "Certificate Minted", type: "certificate" },
        { date: "2024-11-01", event: "Milestone: 1000 Users", type: "milestone" },
        { date: "2024-11-10", event: "Seed Funding: $500K", type: "funding" },
      ],
      aiReport: {
        summary: "Strong technical foundation with proven on-chain activity and active community engagement.",
        strengths: [
          "Well-documented smart contracts with multiple audits",
          "Active GitHub repository with consistent commits",
          "Strong community engagement on Discord and Twitter",
          "Clear roadmap with achievable milestones"
        ],
        weaknesses: [
          "Limited token distribution transparency",
          "Team members have limited previous Web3 experience"
        ],
        successLikelihood: 87,
        redFlags: []
      }
    },
    {
      id: 2,
      name: "ZKProof Identity",
      logo: "🛡️",
      category: "Infrastructure",
      hackathon: "ETHDenver 2024",
      trustScore: 88,
      onChainScore: 90,
      teamScore: 85,
      githubScore: 92,
      communityScore: 84,
      documentScore: 89,
      riskLevel: "low",
      lastVerified: "2024-11-18",
      description: "Zero-knowledge identity verification for Web3",
      timeline: [
        { date: "2024-09-01", event: "Hackathon Submission", type: "submission" },
        { date: "2024-09-20", event: "MVP Deployed", type: "deployment" },
        { date: "2024-10-05", event: "Certificate Minted", type: "certificate" },
        { date: "2024-10-25", event: "Partnership: Polygon", type: "milestone" },
      ],
      aiReport: {
        summary: "Innovative ZK solution with strong technical implementation and growing ecosystem partnerships.",
        strengths: [
          "Novel approach to privacy-preserving identity",
          "Strong technical team with cryptography background",
          "Strategic partnerships with major chains",
          "Well-structured tokenomics"
        ],
        weaknesses: [
          "Market is becoming crowded with ZK identity solutions",
          "Adoption metrics are lower than expected"
        ],
        successLikelihood: 82,
        redFlags: []
      }
    },
    {
      id: 3,
      name: "GameFi Arena",
      logo: "🎮",
      category: "Gaming",
      hackathon: "Solana Hyperdrive 2024",
      trustScore: 75,
      onChainScore: 78,
      teamScore: 72,
      githubScore: 70,
      communityScore: 80,
      documentScore: 75,
      riskLevel: "medium",
      lastVerified: "2024-11-12",
      description: "Web3 gaming platform with play-to-earn mechanics",
      timeline: [
        { date: "2024-08-15", event: "Hackathon Submission", type: "submission" },
        { date: "2024-09-01", event: "Beta Launch", type: "deployment" },
        { date: "2024-09-10", event: "Certificate Minted", type: "certificate" },
      ],
      aiReport: {
        summary: "Promising gaming concept but needs stronger technical execution and clearer monetization strategy.",
        strengths: [
          "Engaging game mechanics",
          "Growing player base",
          "Active social media presence"
        ],
        weaknesses: [
          "Smart contract security concerns identified",
          "Token economics unclear",
          "Team anonymity raises questions",
          "Limited GitHub activity"
        ],
        successLikelihood: 65,
        redFlags: [
          "Some team members could not be verified",
          "Contract audit pending for 3 months"
        ]
      }
    },
    {
      id: 4,
      name: "DataDAO",
      logo: "📊",
      category: "Tooling",
      hackathon: "ETHGlobal Istanbul 2024",
      trustScore: 85,
      onChainScore: 88,
      teamScore: 87,
      githubScore: 82,
      communityScore: 81,
      documentScore: 86,
      riskLevel: "low",
      lastVerified: "2024-11-17",
      description: "Decentralized data marketplace with privacy guarantees",
      timeline: [
        { date: "2024-10-01", event: "Hackathon Submission", type: "submission" },
        { date: "2024-10-18", event: "Mainnet Launch", type: "deployment" },
        { date: "2024-10-22", event: "Certificate Minted", type: "certificate" },
        { date: "2024-11-05", event: "Grant: $100K", type: "funding" },
      ],
      aiReport: {
        summary: "Solid infrastructure project addressing real market need with experienced team.",
        strengths: [
          "Experienced team with previous successful exits",
          "Clear use case and market demand",
          "Strong technical documentation",
          "Active development"
        ],
        weaknesses: [
          "Competitive landscape is intense",
          "User acquisition strategy needs refinement"
        ],
        successLikelihood: 79,
        redFlags: []
      }
    },
    {
      id: 5,
      name: "ChainLink AI",
      logo: "🤖",
      category: "AI",
      hackathon: "ETHDenver 2024",
      trustScore: 68,
      onChainScore: 65,
      teamScore: 70,
      githubScore: 72,
      communityScore: 68,
      documentScore: 66,
      riskLevel: "high",
      lastVerified: "2024-11-10",
      description: "AI-powered oracle network for smart contracts",
      timeline: [
        { date: "2024-09-01", event: "Hackathon Submission", type: "submission" },
        { date: "2024-09-25", event: "Testnet Deployed", type: "deployment" },
      ],
      aiReport: {
        summary: "Ambitious project with technical challenges and verification concerns.",
        strengths: [
          "Innovative concept combining AI and oracles",
          "Some community interest"
        ],
        weaknesses: [
          "Technical implementation unclear",
          "Team credentials difficult to verify",
          "No mainnet deployment",
          "Limited documentation"
        ],
        successLikelihood: 48,
        redFlags: [
          "Missing hackathon certificate verification",
          "GitHub repository has inconsistent activity",
          "Team LinkedIn profiles appear fabricated"
        ]
      }
    }
  ],

  // Hackathons
  hackathons: [
    "All Hackathons",
    "ETHGlobal Istanbul 2024",
    "ETHDenver 2024",
    "Solana Hyperdrive 2024",
    "Polygon zkEVM Hackathon",
    "Base Buildathon"
  ],

  // Categories
  categories: [
    "All Categories",
    "DeFi",
    "Infrastructure",
    "Gaming",
    "Tooling",
    "AI",
    "NFT",
    "Social"
  ],

  // Selected filters
  selectedHackathon: "All Hackathons",
  selectedCategory: "All Categories",
  scoreRange: [0, 100],

  // Actions
  setSelectedHackathon: (hackathon) => set({ selectedHackathon: hackathon }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setScoreRange: (range) => set({ scoreRange: range }),

  // Get filtered startups
  getFilteredStartups: () => {
    const state = useStore.getState()
    let filtered = state.startups

    if (state.selectedHackathon !== "All Hackathons") {
      filtered = filtered.filter(s => s.hackathon === state.selectedHackathon)
    }

    if (state.selectedCategory !== "All Categories") {
      filtered = filtered.filter(s => s.category === state.selectedCategory)
    }

    filtered = filtered.filter(s => 
      s.trustScore >= state.scoreRange[0] && s.trustScore <= state.scoreRange[1]
    )

    return filtered.sort((a, b) => b.trustScore - a.trustScore)
  }
}))
