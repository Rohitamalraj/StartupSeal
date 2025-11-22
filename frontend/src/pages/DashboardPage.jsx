import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Progress } from "../components/ui/progress"
import { 
  Bookmark, MessageSquare, Send, TrendingUp, 
  CheckCircle2, Clock, XCircle, ExternalLink, Loader2, DollarSign, Target, Users as UsersIcon
} from "lucide-react"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { getUserStats, getContactRequests, updateContactRequest } from "../utils/users"
import { getStartupSealsByAddress } from "../utils/blockchain"

export function DashboardPage() {
  const navigate = useNavigate()
  const currentAccount = useCurrentAccount()
  const [stats, setStats] = useState(null)
  const [receivedRequests, setReceivedRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [myStartups, setMyStartups] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!currentAccount) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const [statsData, receivedData, sentData, myStartupsData] = await Promise.all([
          getUserStats(currentAccount.address),
          getContactRequests(currentAccount.address, 'received'),
          getContactRequests(currentAccount.address, 'sent'),
          getStartupSealsByAddress(currentAccount.address)
        ])

        setStats(statsData.stats)
        setReceivedRequests(receivedData.requests || [])
        setSentRequests(sentData.requests || [])
        
        // Get real donations from localStorage
        const getDonations = (startupId) => {
          try {
            const donations = localStorage.getItem(`donations_${startupId}`)
            return donations ? JSON.parse(donations) : []
          } catch (e) {
            return []
          }
        }
        
        // Calculate total donated amount
        const getTotalDonated = (startupId) => {
          const donations = getDonations(startupId)
          return donations.reduce((total, donation) => total + parseFloat(donation.amount || 0), 0)
        }
        
        // Generate consistent fundraising data based on startup ID
        const generateFundraiseData = (startupId) => {
          const seed = startupId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
          const random = (min, max) => min + (seed % (max - min))
          
          const realDonations = getTotalDonated(startupId)
          const baseRaised = random(50000, 300000)
          
          return {
            fundraiseGoal: 500000,
            fundraiseRaised: baseRaised + realDonations,
            backers: random(10, 150) + getDonations(startupId).length,
            daysLeft: random(5, 60)
          }
        }
        
        const startupsWithFundraising = (myStartupsData || []).map(startup => ({
          ...startup,
          ...generateFundraiseData(startup.id)
        }))
        setMyStartups(startupsWithFundraising)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentAccount])

  const handleUpdateRequest = async (requestId, status, response = '') => {
    setUpdating(requestId)
    try {
      await updateContactRequest(requestId, status, response)
      
      // Refresh received requests
      const receivedData = await getContactRequests(currentAccount.address, 'received')
      setReceivedRequests(receivedData.requests || [])
    } catch (error) {
      console.error('Error updating request:', error)
      alert('Failed to update request')
    } finally {
      setUpdating(null)
    }
  }

  const getPurposeLabel = (purpose) => {
    const labels = {
      invest: "💰 Investment Interest",
      "co-found": "🤝 Co-founder Opportunity",
      "use-product": "🛍️ Product Usage",
      hire: "💼 Hiring Interest",
      network: "🌐 Networking",
      other: "📋 Other"
    }
    return labels[purpose] || purpose
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'accepted':
        return <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" />Accepted</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#37322f]" />
          <p className="text-[#605a57]">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!currentAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[#605a57]" />
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-[#605a57] mb-4">
              Please connect your Sui wallet to access your dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-[1400px] mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-[#37322f] text-5xl md:text-6xl font-serif mb-4">
            My Dashboard
          </h1>
          <p className="text-[#605a57] text-lg">
            Manage your saved startups and contact requests
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Bookmark className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#37322f] font-serif">
                    {stats?.savedStartupsCount || 0}
                  </div>
                  <p className="text-sm text-[#605a57]">Saved Startups</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#37322f] font-serif">
                    {stats?.receivedRequestsCount || 0}
                  </div>
                  <p className="text-sm text-[#605a57]">Requests Received</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Send className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#37322f] font-serif">
                    {stats?.sentRequestsCount || 0}
                  </div>
                  <p className="text-sm text-[#605a57]">Requests Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#37322f] font-serif">
                    {stats?.pendingRequestsCount || 0}
                  </div>
                  <p className="text-sm text-[#605a57]">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="mystartups" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mystartups">
              <Target className="w-4 h-4 mr-2" />
              My Fundraising
            </TabsTrigger>
            <TabsTrigger value="received">
              <MessageSquare className="w-4 h-4 mr-2" />
              Received ({stats?.pendingRequestsCount || 0})
            </TabsTrigger>
            <TabsTrigger value="sent">
              <Send className="w-4 h-4 mr-2" />
              Sent Requests
            </TabsTrigger>
          </TabsList>

          {/* My Fundraising Tab */}
          <TabsContent value="mystartups" className="mt-6">
            <div className="space-y-4">
              {myStartups.length === 0 ? (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center text-[#605a57]">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-[#37322f] mb-2">No Verified Startups</h3>
                    <p className="mb-6">You haven't created any verified startup seals yet</p>
                    <Button onClick={() => navigate('/verify')}>
                      Verify Your Startup
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                myStartups.map((startup) => {
                  const progressPercent = Math.round((startup.fundraiseRaised / startup.fundraiseGoal) * 100)
                  return (
                    <Card key={startup.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{startup.name || startup.startup_name}</CardTitle>
                            <CardDescription>
                              {startup.hackathon || startup.hackathon_name}
                            </CardDescription>
                          </div>
                          <Badge variant="success">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Fundraising Progress */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-[#37322f]">
                              ${(startup.fundraiseRaised / 1000).toFixed(1)}K raised
                            </span>
                            <span className="text-[#605a57]">
                              ${(startup.fundraiseGoal / 1000).toFixed(0)}K goal
                            </span>
                          </div>
                          <Progress value={progressPercent} className="h-3" />
                          <div className="flex justify-between text-xs text-[#605a57] mt-2">
                            <span>{progressPercent}% funded</span>
                            <span>{startup.daysLeft} days left</span>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4 py-4 border-y border-[#e0dedb]">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                              <DollarSign className="w-4 h-4" />
                              <span className="text-xl font-bold">${(startup.fundraiseRaised / 1000).toFixed(0)}K</span>
                            </div>
                            <p className="text-xs text-[#605a57]">Raised</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                              <UsersIcon className="w-4 h-4" />
                              <span className="text-xl font-bold">{startup.backers}</span>
                            </div>
                            <p className="text-xs text-[#605a57]">Backers</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                              <Target className="w-4 h-4" />
                              <span className="text-xl font-bold">{startup.trustScore || startup.overall_trust_score}</span>
                            </div>
                            <p className="text-xs text-[#605a57]">Trust Score</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => navigate(`/profile/${startup.id}`)}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Profile
                          </Button>
                          <Button 
                            className="flex-1"
                            onClick={() => navigate('/fundraise')}
                          >
                            View on Fundraise
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>

          {/* Received Requests Tab */}
          <TabsContent value="received" className="mt-6">
            <div className="space-y-4">
              {receivedRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-[#605a57]">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No contact requests received</p>
                  </CardContent>
                </Card>
              ) : (
                receivedRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{request.startupName}</CardTitle>
                          <CardDescription>
                            {getPurposeLabel(request.purpose)}
                          </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-secondary/50 p-3 rounded-lg">
                        <p className="text-sm text-[#37322f] font-medium mb-1">Message:</p>
                        <p className="text-sm text-[#605a57]">{request.message}</p>
                      </div>

                      {request.contactInfo && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-blue-900 font-medium mb-2">Contact Information:</p>
                          {request.contactInfo.email && (
                            <p className="text-xs text-blue-800">📧 {request.contactInfo.email}</p>
                          )}
                          {request.contactInfo.linkedIn && (
                            <p className="text-xs text-blue-800">💼 {request.contactInfo.linkedIn}</p>
                          )}
                          {request.contactInfo.phone && (
                            <p className="text-xs text-blue-800">📞 {request.contactInfo.phone}</p>
                          )}
                        </div>
                      )}

                      <div className="text-xs text-[#605a57]">
                        Received: {new Date(request.createdAt).toLocaleString()}
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            className="flex-1"
                            onClick={() => handleUpdateRequest(request.id, 'accepted', 'Thank you for your interest! I will contact you soon.')}
                            disabled={updating === request.id}
                          >
                            {updating === request.id ? 'Updating...' : 'Accept'}
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleUpdateRequest(request.id, 'rejected', 'Thank you for your interest, but not at this time.')}
                            disabled={updating === request.id}
                          >
                            Decline
                          </Button>
                        </div>
                      )}

                      {request.response && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-sm text-green-900 font-medium mb-1">Your Response:</p>
                          <p className="text-sm text-green-800">{request.response}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Sent Requests Tab */}
          <TabsContent value="sent" className="mt-6">
            <div className="space-y-4">
              {sentRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-[#605a57]">
                    <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No contact requests sent yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => navigate('/fundraise')}
                    >
                      Explore Startups
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                sentRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{request.startupName}</CardTitle>
                          <CardDescription>
                            {getPurposeLabel(request.purpose)}
                          </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-secondary/50 p-3 rounded-lg">
                        <p className="text-sm text-[#37322f] font-medium mb-1">Your Message:</p>
                        <p className="text-sm text-[#605a57]">{request.message}</p>
                      </div>

                      <div className="text-xs text-[#605a57]">
                        Sent: {new Date(request.createdAt).toLocaleString()}
                      </div>

                      {request.response && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-blue-900 font-medium mb-1">Their Response:</p>
                          <p className="text-sm text-blue-800">{request.response}</p>
                          {request.respondedAt && (
                            <p className="text-xs text-blue-700 mt-1">
                              Responded: {new Date(request.respondedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}

                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate(`/profile/${request.startupId}`)}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Startup
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
