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
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import { ContactStartupDialog } from "../components/ContactStartupDialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { recordDonation, getDonations } from "../utils/users"

export function FundraisePage() {
  const navigate = useNavigate()
  const currentAccount = useCurrentAccount()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  const storeStartups = useStore((state) => state.startups)
  const fetchStartups = useStore((state) => state.fetchStartups)
  const categories = useStore((state) => state.categories)
  
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [searchQuery, setSearchQuery] = useState("")
  const [donationAmounts, setDonationAmounts] = useState({})
  const [processingDonations, setProcessingDonations] = useState({})
  const [showDonateDialog, setShowDonateDialog] = useState(false)
  const [selectedStartup, setSelectedStartup] = useState(null)
  const [donationsData, setDonationsData] = useState({}) // Store donations from API

  // Fetch startups from blockchain on mount
  useEffect(() => {
    console.log('📊 Fundraise page: Fetching startups from blockchain...')
    fetchStartups()
  }, [fetchStartups])

  useEffect(() => {
    console.log('📄 Fundraise page: Startups data updated:', storeStartups)
    console.log('   Total startups:', storeStartups.length)
  }, [storeStartups])

  // Fetch donations data for all startups
  useEffect(() => {
    const fetchAllDonations = async () => {
      const donationsMap = {}
      for (const startup of storeStartups) {
        try {
          const response = await getDonations(startup.id)
          donationsMap[startup.id] = response.stats || { totalAmount: 0, totalBackers: 0 }
        } catch (error) {
          console.error(`Error fetching donations for ${startup.id}:`, error)
          donationsMap[startup.id] = { totalAmount: 0, totalBackers: 0 }
        }
      }
      setDonationsData(donationsMap)
    }

    if (storeStartups.length > 0) {
      fetchAllDonations()
    }
  }, [storeStartups])

  // Generate consistent fundraising data based on startup ID
  const generateFundraiseData = (startupId) => {
    // Use startup ID as seed for consistent values
    const seed = startupId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const random = (min, max) => min + (seed % (max - min))
    
    // Get real donated amount from API
    const realDonations = donationsData[startupId]?.totalAmount || 0
    const realBackers = donationsData[startupId]?.totalBackers || 0
    const baseRaised = random(10000, 200000)
    
    return {
      fundraiseGoal: random(100000, 500000),
      fundraiseRaised: baseRaised + realDonations, // Add real donations to base amount
      backers: random(10, 150) + realBackers, // Add real backers
      daysLeft: random(5, 60)
    }
  }

  // Add fundraising-specific data to startups
  const allStartups = storeStartups.map(startup => {
    console.log('   Processing startup:', startup.name || startup.startup_name, startup)
    const fundraiseData = generateFundraiseData(startup.id)
    return {
      ...startup,
      ...fundraiseData
    }
  })

  const filteredStartups = allStartups.filter(startup => {
    const matchesCategory = selectedCategory === "All Categories" || startup.category === selectedCategory
    const matchesSearch = startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         startup.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleDonationChange = (startupId, amount) => {
    setDonationAmounts({ ...donationAmounts, [startupId]: amount })
  }

  const openDonateDialog = (startup) => {
    setSelectedStartup(startup)
    setShowDonateDialog(true)
  }

  const handleDonate = async () => {
    if (!currentAccount || !selectedStartup) {
      return
    }

    const amount = donationAmounts[selectedStartup.id]
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid donation amount")
      return
    }

    const recipientAddress = selectedStartup.walletAddress || selectedStartup.owner
    if (!recipientAddress) {
      alert("Recipient address not found")
      return
    }

    setProcessingDonations({ ...processingDonations, [selectedStartup.id]: true })
    
    try {
      const tx = new Transaction()
      
      // Convert SUI amount to MIST (1 SUI = 1,000,000,000 MIST)
      const amountInMist = Math.floor(parseFloat(amount) * 1_000_000_000)
      
      // Split coin for the exact amount
      const [coin] = tx.splitCoins(tx.gas, [amountInMist])
      
      // Transfer to recipient
      tx.transferObjects([coin], recipientAddress)
      
      // Execute transaction
      signAndExecuteTransaction(
        {
          transaction: tx,
          options: {
            showEffects: true,
            showObjectChanges: true,
          }
        },
        {
          onSuccess: async (result) => {
            console.log('✅ Donation successful:', result)
            
            // Record donation in backend
            try {
              await recordDonation({
                startupId: selectedStartup.id,
                amount: amount,
                from: currentAccount.address,
                to: recipientAddress,
                txDigest: result.digest,
                timestamp: new Date().toISOString()
              })
              console.log('💾 Donation recorded in backend')
              
              // Refresh donations data
              const response = await getDonations(selectedStartup.id)
              setDonationsData({
                ...donationsData,
                [selectedStartup.id]: response.stats || { totalAmount: 0, totalBackers: 0 }
              })
            } catch (e) {
              console.error('Error recording donation:', e)
            }
            
            alert(`Successfully donated ${amount} SUI to ${selectedStartup.name}!\n\nTransaction: ${result.digest}`)
            setDonationAmounts({ ...donationAmounts, [selectedStartup.id]: "" })
            setShowDonateDialog(false)
            setProcessingDonations({ ...processingDonations, [selectedStartup.id]: false })
          },
          onError: (error) => {
            console.error('❌ Donation failed:', error)
            alert(`Donation failed: ${error.message || 'Unknown error'}`)
            setProcessingDonations({ ...processingDonations, [selectedStartup.id]: false })
          }
        }
      )
    } catch (error) {
      console.error('❌ Error building transaction:', error)
      alert(`Error: ${error.message || 'Failed to build transaction'}`)
      setProcessingDonations({ ...processingDonations, [selectedStartup.id]: false })
    }
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

        {/* Empty State */}
        {filteredStartups.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="pt-12 pb-12 text-center">
              <Coins className="w-16 h-16 mx-auto mb-4 text-[#605a57] opacity-50" />
              <h3 className="text-xl font-semibold text-[#37322f] mb-2">No Startups Fundraising</h3>
              <p className="text-[#605a57] mb-6">
                No startups are currently fundraising. Be the first to create a verified startup!
              </p>
              <Button onClick={() => navigate('/verify')}>
                Verify Your Startup
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Startup Cards */}
        {filteredStartups.length > 0 && (
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
                      <ContactStartupDialog 
                        startup={{
                          id: startup.id,
                          name: startup.name,
                          walletAddress: startup.walletAddress,
                          owner: startup.owner
                        }}
                        trigger={
                          <Button variant="outline" className="flex-1">
                            Contact
                          </Button>
                        }
                      />
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
                        onClick={() => openDonateDialog(startup)}
                        disabled={!currentAccount || !donationAmount || parseFloat(donationAmount) <= 0}
                        className="px-6"
                      >
                        <Coins className="w-4 h-4 mr-2" />
                        Donate
                      </Button>
                    </div>
                    {!currentAccount && (
                      <p className="text-xs text-[#605a57]">
                        Connect your Sui wallet to donate or contact startups
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
          </div>
        )}
      </div>

      {/* Donation Confirmation Dialog */}
      {selectedStartup && (
        <Dialog open={showDonateDialog} onOpenChange={setShowDonateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-blue-600" />
                Confirm Donation
              </DialogTitle>
              <DialogDescription>
                Review your donation details before sending
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Startup Info */}
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <img
                  src={selectedStartup.logo}
                  alt={selectedStartup.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold text-[#37322f]">{selectedStartup.name}</h3>
                  <p className="text-sm text-[#605a57]">{selectedStartup.category}</p>
                </div>
              </div>

              {/* Amount */}
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">Donation Amount</span>
                  <Badge variant="outline" className="bg-blue-100">
                    Trust Score: {selectedStartup.trustScore}
                  </Badge>
                </div>
                <div className="text-3xl font-bold text-blue-600 font-serif">
                  {donationAmounts[selectedStartup.id] || '0'} SUI
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  ≈ ${(parseFloat(donationAmounts[selectedStartup.id] || 0) * 3.50).toFixed(2)} USD
                </p>
              </div>

              {/* Recipient */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#37322f]">Recipient Address</label>
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <code className="text-xs text-[#605a57] break-all block">
                    {selectedStartup.walletAddress || selectedStartup.owner}
                  </code>
                </div>
              </div>

              {/* Warning */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>⚠️ Important:</strong> This transaction is irreversible. Please verify the recipient address before proceeding.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDonateDialog(false)}
                  className="flex-1"
                  disabled={processingDonations[selectedStartup.id]}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDonate}
                  disabled={processingDonations[selectedStartup.id]}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {processingDonations[selectedStartup.id] ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Coins className="w-4 h-4 mr-2" />
                      Send Funds
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
