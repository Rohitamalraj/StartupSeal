import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Trophy, TrendingUp, Calendar, Loader2, AlertCircle } from "lucide-react"
import { useStore } from "../store/useStore"
import { Button } from "../components/ui/button"

export function LeaderboardPage() {
  const { 
    startups, 
    loading, 
    error, 
    hackathons, 
    categories,
    selectedHackathon,
    selectedCategory,
    setSelectedHackathon,
    setSelectedCategory,
    fetchLeaderboard 
  } = useStore()

  // Use mock data for now
  const mockStartups = [
    {
      id: "mock-1",
      name: "DeFiChain Protocol",
      logo: "🔷",
      category: "DeFi",
      hackathon: "ETHGlobal Istanbul 2024",
      trustScore: 92,
      riskLevel: "Low",
      lastVerified: "2024-11-15",
      description: "Decentralized lending protocol with cross-chain capabilities"
    },
    {
      id: "mock-2",
      name: "ZKProof Identity",
      logo: "🛡️",
      category: "Infrastructure",
      hackathon: "ETHDenver 2024",
      trustScore: 88,
      riskLevel: "Low",
      lastVerified: "2024-11-18",
      description: "Zero-knowledge identity verification for Web3"
    },
    {
      id: "mock-3",
      name: "NFT Marketplace Pro",
      logo: "🎨",
      category: "NFT",
      hackathon: "NFT NYC 2024",
      trustScore: 85,
      riskLevel: "Low",
      lastVerified: "2024-11-10",
      description: "Next-gen NFT marketplace with royalty protection"
    },
    {
      id: "mock-4",
      name: "GameFi Arena",
      logo: "🎮",
      category: "Gaming",
      hackathon: "Starknet Resolve 2024",
      trustScore: 78,
      riskLevel: "Medium",
      lastVerified: "2024-11-20",
      description: "Play-to-earn gaming platform on Sui"
    },
    {
      id: "mock-5",
      name: "DAO Governance Tool",
      logo: "🏛️",
      category: "DAO",
      hackathon: "Sui Overflow 2024",
      trustScore: 82,
      riskLevel: "Low",
      lastVerified: "2024-11-12",
      description: "Decentralized governance framework for DAOs"
    }
  ]

  const filteredStartups = mockStartups
    .filter(startup => {
      const matchesHackathon = selectedHackathon === "All Hackathons" || startup.hackathon === selectedHackathon
      const matchesCategory = selectedCategory === "All Categories" || startup.category === selectedCategory
      return matchesHackathon && matchesCategory
    })
    .sort((a, b) => b.trustScore - a.trustScore)

  const getScoreColor = (score) => {
    if (score >= 85) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getRiskBadgeVariant = (level) => {
    switch (level) {
      case "low": return "success"
      case "medium": return "warning"
      case "high": return "danger"
      default: return "default"
    }
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return "🥇"
    if (rank === 2) return "🥈"
    if (rank === 3) return "🥉"
    return `#${rank}`
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="w-8 h-8 text-[#37322f]" />
            <h1 className="text-[#37322f] text-5xl font-serif">Startup Leaderboard</h1>
          </div>
          <p className="text-[#605a57] text-lg max-w-2xl mx-auto">
            Discover the most trustworthy and verified Web3 startups, ranked by their trust scores.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#37322f] mb-2">
                  Hackathon
                </label>
                <Select value={selectedHackathon} onValueChange={setSelectedHackathon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hackathons.map((hackathon) => (
                      <SelectItem key={hackathon} value={hackathon}>
                        {hackathon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#37322f] mb-2">
                  Category
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <div className="text-sm text-[#605a57]">
                  Showing <span className="font-semibold text-[#37322f]">{filteredStartups.length}</span> startups
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        {filteredStartups.length === 0 && !loading && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-[#605a57] opacity-50" />
              <h3 className="text-xl font-semibold text-[#37322f] mb-2">No Startups Found</h3>
              <p className="text-[#605a57] mb-6">
                {error ? 'Unable to fetch startups. Please try again later.' : 'Be the first to verify your startup!'}
              </p>
              <Button onClick={() => window.location.href = '/verify'}>
                Verify Your Startup
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Desktop Table View */}
        {filteredStartups.length > 0 && (
          <Card className="hidden md:block">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Rank</TableHead>
                    <TableHead>Startup</TableHead>
                    <TableHead>Trust Score</TableHead>
                    <TableHead>Hackathon</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Last Verified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStartups.map((startup, index) => (
                  <TableRow key={startup.id} className="hover:bg-muted/50 cursor-pointer">
                    <TableCell>
                      <div className="font-semibold text-lg">
                        {getRankIcon(index + 1)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link to={`/profile/${startup.id}`} className="hover:underline">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{startup.logo}</span>
                          <div>
                            <div className="font-semibold text-[#37322f]">{startup.name}</div>
                            <div className="text-xs text-[#605a57]">{startup.description.slice(0, 50)}...</div>
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingUp className={`w-4 h-4 ${getScoreColor(startup.trustScore)}`} />
                        <span className={`font-bold text-lg ${getScoreColor(startup.trustScore)}`}>
                          {startup.trustScore}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-[#605a57]">{startup.hackathon}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{startup.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRiskBadgeVariant(startup.riskLevel)}>
                        {startup.riskLevel.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-[#605a57]">
                        <Calendar className="w-4 h-4" />
                        {startup.lastVerified}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Mobile Card View */}
        {filteredStartups.length > 0 && (
          <div className="md:hidden space-y-4">
          {filteredStartups.map((startup, index) => (
            <Link key={startup.id} to={`/profile/${startup.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl font-semibold">{getRankIcon(index + 1)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{startup.logo}</span>
                        <div>
                          <h3 className="font-semibold text-[#37322f]">{startup.name}</h3>
                          <Badge variant="outline" className="mt-1">{startup.category}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-[#605a57] mb-3">{startup.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#605a57]">Trust Score:</span>
                          <span className={`font-bold text-lg ${getScoreColor(startup.trustScore)}`}>
                            {startup.trustScore}
                          </span>
                        </div>
                        <Badge variant={getRiskBadgeVariant(startup.riskLevel)}>
                          {startup.riskLevel.toUpperCase()} RISK
                        </Badge>
                      </div>
                      <div className="text-xs text-[#605a57] mt-2">
                        {startup.hackathon} • Last verified: {startup.lastVerified}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
