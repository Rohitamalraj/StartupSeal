import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import { Progress } from "../components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Coins, TrendingUp, Users, Target, ExternalLink, Search, Shield, CheckCircle2 } from "lucide-react"
import { useStore } from "../store/useStore"
import { useCurrentAccount } from "@mysten/dapp-kit"

export function FundraisePage() {
  const navigate = useNavigate()
  const currentAccount = useCurrentAccount()
  const storeStartups = useStore((state) => state.startups)
  const fetchStartups = useStore((state) => state.fetchStartups)
  const categories = useStore((state) => state.categories)
  
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [searchQuery, setSearchQuery] = useState("")
  const [donationAmounts, setDonationAmounts] = useState({})
  const [processingDonations, setProcessingDonations] = useState({})

  // Fetch startups from blockchain on mount
  useEffect(() => {
    fetchStartups()
  }, [fetchStartups])

  // Add fundraising-specific data to startups
  const allStartups = storeStartups.map(startup => ({
    ...startup,
    // Add mock fundraising data (these could be fetched from blockchain in the future)
    fundraiseGoal: Math.floor(Math.random() * 450000) + 50000,
    fundraiseRaised: Math.floor(Math.random() * 200000) + 10000,
    backers: Math.floor(Math.random() * 150) + 10,
    daysLeft: Math.floor(Math.random() * 60) + 1,
  }))

  const filteredStartups = allStartups.filter(startup => {
    const matchesCategory = selectedCategory === "All Categories" || startup.category === selectedCategory
    const matchesSearch = startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         startup.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleDonationChange = (startupId, amount) => {
    setDonationAmounts({ ...donationAmounts, [startupId]: amount })
  }

  const handleDonate = async (startupId, startupName) => {
    if (!currentAccount) {
      alert("Please connect your Sui wallet first")
      return
    }

    const amount = donationAmounts[startupId]
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid donation amount")
      return
    }

    setProcessingDonations({ ...processingDonations, [startupId]: true })
    
    // Simulate blockchain transaction
    setTimeout(() => {
      alert(`Successfully donated ${amount} SUI to ${startupName}!`)
      setDonationAmounts({ ...donationAmounts, [startupId]: "" })
      setProcessingDonations({ ...processingDonations, [startupId]: false })
    }, 2000)
  }

  const getRiskBadgeVariant = (riskLevel) => {
    switch (riskLevel) {
      case "Low": return "success"
      case "Medium": return "warning"
      case "High": return "danger"
      default: return "default"
    }
  }

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-[1400px] mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-[#37322f] text-5xl md:text-6xl font-serif mb-4">
            Fundraising Startups
          </h1>
          <p className="text-[#605a57] text-lg max-w-3xl mx-auto">
            Support verified Web3 startups with transparent fundraising. Donate using SUI tokens and help innovative projects reach their goals.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#37322f] font-serif">
                    ${(allStartups.reduce((acc, s) => acc + s.fundraiseGoal, 0) / 1000).toFixed(0)}K
                  </div>
                  <p className="text-sm text-[#605a57]">Total Goal</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#37322f] font-serif">
                    ${(allStartups.reduce((acc, s) => acc + s.fundraiseRaised, 0) / 1000).toFixed(0)}K
                  </div>
                  <p className="text-sm text-[#605a57]">Total Raised</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#37322f] font-serif">
                    {allStartups.reduce((acc, s) => acc + s.backers, 0)}
                  </div>
                  <p className="text-sm text-[#605a57]">Total Backers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Coins className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#37322f] font-serif">
                    {filteredStartups.length}
                  </div>
                  <p className="text-sm text-[#605a57]">Active Campaigns</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#605a57] w-5 h-5" />
            <Input
              placeholder="Search startups..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px]">
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

        {/* Startup Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredStartups.map((startup) => {
            const progressPercent = Math.round((startup.fundraiseRaised / startup.fundraiseGoal) * 100)
            const isDonating = processingDonations[startup.id]
            const donationAmount = donationAmounts[startup.id] || ""

            return (
              <Card key={startup.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={startup.logo}
                        alt={startup.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <CardTitle className="text-xl mb-1">{startup.name}</CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline">{startup.category}</Badge>
                          <Badge variant={getRiskBadgeVariant(startup.riskLevel)}>
                            Trust Score: {startup.trustScore}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/profile/${startup.id}`)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardDescription className="mt-3">
                    {startup.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-[#37322f]">
                        ${(startup.fundraiseRaised / 1000).toFixed(1)}K raised
                      </span>
                      <span className="text-[#605a57]">
                        ${(startup.fundraiseGoal / 1000).toFixed(0)}K goal
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                    <div className="flex justify-between text-xs text-[#605a57] mt-2">
                      <span>{progressPercent}% funded</span>
                      <span>{startup.daysLeft} days left</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#e0dedb]">
                    <div>
                      <div className="text-2xl font-bold text-[#37322f] font-serif">
                        {startup.backers}
                      </div>
                      <p className="text-sm text-[#605a57]">Backers</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#37322f] font-serif">
                        {startup.hackathon}
                      </div>
                      <p className="text-sm text-[#605a57]">Hackathon</p>
                    </div>
                  </div>

                  {/* GitHub Repository */}
                  {startup.githubRepo && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-blue-900 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          GitHub Repository:
                        </span>
                      </div>
                      <a 
                        href={`https://github.com/${startup.githubRepo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 underline break-all block"
                      >
                        {startup.githubRepo}
                      </a>
                    </div>
                  )}

                  {/* Blockchain Verification */}
                  {startup.explorerLink && (
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-purple-900 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Verified On-Chain
                        </span>
                        <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Nautilus Proof
                        </Badge>
                      </div>
                      <a 
                        href={startup.explorerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-600 hover:text-purple-800 underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View on Sui Explorer
                      </a>
                    </div>
                  )}

                  {/* Wallet Address */}
                  {startup.walletAddress && (
                    <div className="bg-secondary/50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-[#37322f]">Owner Wallet:</span>
                        <Badge variant="outline" className="text-xs">
                          {startup.verified ? '✅ Verified' : '⚠️ Pending'}
                        </Badge>
                      </div>
                      <code className="text-xs text-[#605a57] break-all block">
                        {startup.walletAddress}
                      </code>
                    </div>
                  )}

                  {/* Donation Input */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Amount in SUI"
                        value={donationAmount}
                        onChange={(e) => handleDonationChange(startup.id, e.target.value)}
                        className="flex-1"
                        min="0"
                        step="0.1"
                      />
                      <Button
                        onClick={() => handleDonate(startup.id, startup.name)}
                        disabled={isDonating || !currentAccount || !donationAmount}
                        className="px-6"
                      >
                        {isDonating ? (
                          <>Processing...</>
                        ) : (
                          <>
                            <Coins className="w-4 h-4 mr-2" />
                            Donate
                          </>
                        )}
                      </Button>
                    </div>
                    {!currentAccount && (
                      <p className="text-xs text-[#605a57]">
                        Connect your Sui wallet to donate
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredStartups.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#605a57] text-lg">No startups found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
