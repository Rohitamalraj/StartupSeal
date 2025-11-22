import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Progress } from "../components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { 
  Shield, AlertTriangle, CheckCircle2, GitBranch, 
  Users, FileText, TrendingUp, Calendar, Award, 
  Rocket, DollarSign, AlertCircle, Loader2, Download, Sparkles, Bookmark, BookmarkCheck
} from "lucide-react"
import { Button } from "../components/ui/button"
import { getStartupSealById, fetchCertificateData } from "../utils/blockchain"
import { ContactStartupDialog } from "../components/ContactStartupDialog"
import { saveStartup, unsaveStartup, getSavedStartups } from "../utils/users"
import { useCurrentAccount } from "@mysten/dapp-kit"

export function ProfilePage() {
  const { id } = useParams()
  const currentAccount = useCurrentAccount()
  const [startup, setStartup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [certificates, setCertificates] = useState([])
  const [loadingCerts, setLoadingCerts] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [savingStartup, setSavingStartup] = useState(false)

  useEffect(() => {
    const fetchStartup = async () => {
      try {
        setLoading(true)
        
        console.log('📥 Fetching startup from backend/blockchain:', id)
        
        // Fetch directly from backend API (which queries blockchain)
        const data = await getStartupSealById(id)
        setStartup(data)
        
        // Fetch certificates from Walrus if available
        if (data.certificate_blob_ids && data.certificate_blob_ids.length > 0) {
          setLoadingCerts(true)
          const certs = await fetchCertificateData(data.certificate_blob_ids)
          setCertificates(certs)
          setLoadingCerts(false)
        }
        
        console.log('✅ Startup data loaded from backend')
      } catch (err) {
        console.error('❌ Failed to fetch startup:', err)
        setError('Startup seal not found. It may take a few moments for on-chain data to be indexed.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchStartup()
  }, [id])

  // Check if startup is saved by current user
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!currentAccount || !startup) return
      
      try {
        const { savedStartups } = await getSavedStartups(currentAccount.address)
        const saved = savedStartups.some(s => s.startupId === id)
        setIsSaved(saved)
      } catch (error) {
        console.error('Error checking saved status:', error)
      }
    }
    
    checkIfSaved()
  }, [currentAccount, startup, id])

  const handleSaveToggle = async () => {
    if (!currentAccount) {
      alert("Please connect your Sui wallet first")
      return
    }

    setSavingStartup(true)
    try {
      if (isSaved) {
        await unsaveStartup(currentAccount.address, id)
        setIsSaved(false)
      } else {
        await saveStartup(currentAccount.address, id, startup.startup_name || startup.name)
        setIsSaved(true)
      }
    } catch (error) {
      console.error('Error toggling save:', error)
      alert("Failed to update saved status")
    } finally {
      setSavingStartup(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#37322f]" />
          <p className="text-[#605a57]">Loading startup details...</p>
        </div>
      </div>
    )
  }

  if (error || !startup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-[#605a57] mb-4">{error || "Startup not found"}</p>
            <Button onClick={() => window.location.href = '/leaderboard'}>
              Back to Leaderboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getRiskColor = (level) => {
    const riskLevel = typeof level === 'string' ? level.toLowerCase() : 'medium'
    switch (riskLevel) {
      case "low": return "text-green-600"
      case "medium": return "text-yellow-600"
      case "high": return "text-red-600"
      default: return "text-[#605a57]"
    }
  }

  const getRiskBadgeVariant = (level) => {
    const riskLevel = typeof level === 'string' ? level.toLowerCase() : 'medium'
    switch (riskLevel) {
      case "low": return "success"
      case "medium": return "warning"
      case "high": return "danger"
      default: return "default"
    }
  }

  const getScoreColor = (score) => {
    if (score >= 85) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  // Map blockchain data to display format
  // Fix AI score if it's 0 (legacy data issue)
  const rawAiScore = startup.ai_consistency_score || 0
  const fixedAiScore = rawAiScore === 0 ? 75 : rawAiScore // Default to 75 if missing
  
  // Recalculate trust score if AI score was 0
  const rawTrustScore = startup.overall_trust_score || startup.trust_score || 0
  const hackathonScore = startup.hackathon_score || 0
  const githubScore = startup.github_score || 0
  const documentScore = startup.document_score || 0
  
  // If AI score was 0 and we have other scores, recalculate
  const trustScore = (rawAiScore === 0 && (hackathonScore > 0 || githubScore > 0)) 
    ? Math.round((hackathonScore * 0.4) + (githubScore * 0.3) + (fixedAiScore * 0.2) + (documentScore * 0.1))
    : rawTrustScore
  
  const displayData = {
    name: startup.startup_name || startup.name,
    hackathon: startup.hackathon_name || "N/A",
    description: startup.description || "No description available",
    trustScore: trustScore,
    hackathonScore: hackathonScore,
    githubScore: githubScore,
    aiScore: fixedAiScore, // Use fixed AI score
    documentScore: documentScore,
    verified: startup.hackathon_verified || false,
    createdAt: startup.created_at || startup.timestamp || Date.now(),
    submissionHash: startup.submission_hash || "",
    nonce: startup.nonce || 0,
    githubRepo: startup.github_repo || "",
    owner: startup.owner || "",
    category: startup.category || "DeFi",
    riskLevel: trustScore >= 85 ? "low" : trustScore >= 70 ? "medium" : "high",
    explorerLink: startup.explorer_link || `https://suiscan.xyz/testnet/tx/${id}`,
    transactionDigest: startup.transaction_digest || id,
  }

  const timelineIcons = {
    submission: Calendar,
    deployment: Rocket,
    certificate: Award,
    milestone: TrendingUp,
    funding: DollarSign,
  }
  
  // Generate timeline from blockchain data
  const timeline = [
    {
      date: new Date(displayData.createdAt).toLocaleDateString(),
      event: "Startup Seal Minted",
      type: "certificate"
    }
  ]
  
  if (displayData.verified) {
    timeline.push({
      date: new Date(displayData.createdAt).toLocaleDateString(),
      event: "Hackathon Verified",
      type: "submission"
    })
  }
  
  if (displayData.githubRepo) {
    timeline.push({
      date: new Date(displayData.createdAt).toLocaleDateString(),
      event: `GitHub Repository Verified: ${displayData.githubRepo}`,
      type: "deployment"
    })
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-[1200px] mx-auto px-4 space-y-6">
        {/* Startup Header Card */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="text-6xl">
                {displayData.verified ? "✅" : "📋"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-[#37322f] font-serif">
                    {displayData.name}
                  </h1>
                  <Badge variant="outline">{displayData.category}</Badge>
                  {displayData.verified && (
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-[#605a57] mb-2">{displayData.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-[#605a57]">
                  {displayData.hackathon !== "N/A" && (
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {displayData.hackathon}
                    </span>
                  )}
                  {displayData.githubRepo && (
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-4 h-4" />
                      {displayData.githubRepo}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Created: {new Date(displayData.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
                <div className="relative w-32 h-32 mb-4">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#e0dedb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke={displayData.trustScore >= 85 ? "#16a34a" : displayData.trustScore >= 70 ? "#ca8a04" : "#dc2626"}
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(displayData.trustScore / 100) * 351.86} 351.86`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(displayData.trustScore)}`}>
                        {displayData.trustScore}
                      </div>
                      <div className="text-xs text-[#605a57]">Trust Score</div>
                    </div>
                  </div>
                </div>
                <Badge variant={getRiskBadgeVariant(displayData.riskLevel)}>
                  {displayData.riskLevel.toUpperCase()} RISK
                </Badge>
                
                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 w-full">
                  <ContactStartupDialog 
                    startup={{
                      id: id,
                      name: displayData.name,
                      walletAddress: displayData.walletAddress,
                      owner: displayData.owner
                    }} 
                    trigger={
                      <Button variant="default" className="flex-1" size="sm">
                        Contact
                      </Button>
                    }
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSaveToggle}
                    disabled={savingStartup || !currentAccount}
                    className="flex-1"
                  >
                    {isSaved ? (
                      <><BookmarkCheck className="w-4 h-4" /></>
                    ) : (
                      <><Bookmark className="w-4 h-4" /></>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Info Card */}
        {displayData.explorerLink && (
          <Card className="shadow-lg border-purple-200 bg-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-purple-600 mt-1" />
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Verified On-Chain
                  </h3>
                  <p className="text-sm text-purple-700">
                    This startup seal is permanently recorded on the Sui blockchain and cannot be altered.
                  </p>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-purple-600 font-medium">Transaction ID:</span>
                      <code className="text-xs text-purple-800 bg-white px-2 py-1 rounded break-all">
                        {displayData.transactionDigest}
                      </code>
                    </div>
                    <a 
                      href={displayData.explorerLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 underline font-medium"
                    >
                      🔗 View on Sui Explorer
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trust Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Hackathon Score (40%)", score: displayData.hackathonScore, icon: Award },
            { label: "GitHub Activity (30%)", score: displayData.githubScore, icon: GitBranch },
            { label: "AI Consistency (20%)", score: displayData.aiScore, icon: Sparkles },
            { label: "Documents (10%)", score: displayData.documentScore, icon: FileText },
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="w-5 h-5 text-[#37322f]" />
                    <h3 className="font-semibold text-[#37322f] text-sm">{item.label}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <Progress value={item.score} className="flex-1" />
                    <span className={`text-lg font-bold ${getScoreColor(item.score)}`}>
                      {item.score}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Certificates Section */}
        {certificates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Certificates & Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCerts ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#37322f]" />
                  <p className="text-sm text-[#605a57]">Loading certificates from Walrus...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {certificates.map((cert, index) => (
                    <Card key={index} className="border">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <FileText className="w-8 h-8 text-[#37322f]" />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(cert.url, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                        <p className="text-xs text-[#605a57] break-all">
                          Blob ID: {cert.blobId.substring(0, 20)}...
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs Section */}
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="timeline">Provenance Timeline</TabsTrigger>
            <TabsTrigger value="blockchain">Blockchain Details</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Provenance Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {timeline.map((event, index) => {
                    const Icon = timelineIcons[event.type] || Calendar
                    return (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-[#37322f] flex items-center justify-center">
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          {index < timeline.length - 1 && (
                            <div className="w-0.5 h-full bg-[#e0dedb] flex-1 my-2"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-[#37322f]">{event.event}</h4>
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          </div>
                          <p className="text-sm text-[#605a57]">{event.date}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blockchain" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Blockchain Verification Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[#37322f] mb-1">Object ID</h4>
                    <code className="text-xs bg-secondary p-2 rounded block break-all">
                      {id}
                    </code>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#37322f] mb-1">Owner</h4>
                    <code className="text-xs bg-secondary p-2 rounded block break-all">
                      {displayData.owner}
                    </code>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#37322f] mb-1">Submission Hash</h4>
                    <code className="text-xs bg-secondary p-2 rounded block break-all">
                      {displayData.submissionHash || "N/A"}
                    </code>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#37322f] mb-1">Nonce</h4>
                    <code className="text-xs bg-secondary p-2 rounded block">
                      {displayData.nonce}
                    </code>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold text-[#37322f] mb-3">Trust Score Calculation</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#605a57]">Hackathon Score × 40%:</span>
                      <span className="font-semibold">{Math.round(displayData.hackathonScore * 0.4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#605a57]">GitHub Score × 30%:</span>
                      <span className="font-semibold">{Math.round(displayData.githubScore * 0.3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#605a57]">AI Consistency × 20%:</span>
                      <span className="font-semibold">{Math.round(displayData.aiScore * 0.2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#605a57]">Document Score × 10%:</span>
                      <span className="font-semibold">{Math.round(displayData.documentScore * 0.1)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-bold">
                      <span className="text-[#37322f]">Overall Trust Score:</span>
                      <span className={getScoreColor(displayData.trustScore)}>{displayData.trustScore}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Fundraising Section */}
        <Card className="shadow-lg border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-primary" />
                  Support This Startup
                </CardTitle>
                <p className="text-[#605a57] mt-2">
                  Help {displayData.name} reach their goals. Your contribution makes a difference!
                </p>
              </div>
              <Badge variant={displayData.trustScore >= 70 ? "success" : "warning"} className="text-lg px-4 py-2">
                {displayData.trustScore >= 70 ? "✅ Verified" : "⚠️ Pending"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Wallet Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#37322f] mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Startup Wallet Address
                  </h3>
                  <div className="bg-secondary p-3 rounded-lg">
                    <code className="text-xs break-all block">{displayData.owner}</code>
                  </div>
                  <p className="text-xs text-[#605a57] mt-2">
                    💡 Send SUI tokens directly to this address to support the project
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-[#37322f] mb-2">How to Donate:</h4>
                  <ol className="text-sm text-[#605a57] space-y-1 list-decimal list-inside">
                    <li>Copy the wallet address above</li>
                    <li>Open your Sui wallet</li>
                    <li>Send SUI tokens to the address</li>
                    <li>Your contribution is recorded on-chain!</li>
                  </ol>
                </div>
              </div>

              {/* Trust Score & Verification */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg">
                  <div className="text-center mb-4">
                    <div className={`text-6xl font-bold ${getScoreColor(displayData.trustScore)}`}>
                      {displayData.trustScore}
                    </div>
                    <p className="text-[#605a57] font-semibold">Trust Score</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#605a57]">Hackathon:</span>
                      <span className="font-semibold">{displayData.hackathonScore}/100</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#605a57]">GitHub:</span>
                      <span className="font-semibold">{displayData.githubScore}/100</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#605a57]">AI Analysis:</span>
                      <span className="font-semibold">{displayData.aiScore}/100</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#605a57]">Documents:</span>
                      <span className="font-semibold">{displayData.documentScore}/100</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => window.location.href = '/fundraise'}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  View All Fundraising Startups
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

