import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Progress } from "../components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { 
  Shield, AlertTriangle, CheckCircle2, GitBranch, 
  Users, FileText, TrendingUp, Calendar, Award, 
  Rocket, DollarSign, AlertCircle 
} from "lucide-react"
import { useStore } from "../store/useStore"

export function ProfilePage() {
  const { id } = useParams()
  const startups = useStore((state) => state.startups)
  const startup = startups.find((s) => s.id === parseInt(id))

  if (!startup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#605a57]">Startup not found</p>
      </div>
    )
  }

  const getRiskColor = (level) => {
    switch (level) {
      case "low": return "text-green-600"
      case "medium": return "text-yellow-600"
      case "high": return "text-red-600"
      default: return "text-[#605a57]"
    }
  }

  const getRiskBadgeVariant = (level) => {
    switch (level) {
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

  const timelineIcons = {
    submission: Calendar,
    deployment: Rocket,
    certificate: Award,
    milestone: TrendingUp,
    funding: DollarSign,
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-[1200px] mx-auto px-4 space-y-6">
        {/* Startup Header Card */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="text-6xl">{startup.logo}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-[#37322f] font-serif">
                    {startup.name}
                  </h1>
                  <Badge variant="outline">{startup.category}</Badge>
                </div>
                <p className="text-[#605a57] mb-2">{startup.description}</p>
                <div className="flex items-center gap-4 text-sm text-[#605a57]">
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    {startup.hackathon}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Last verified: {startup.lastVerified}
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
                      stroke={startup.trustScore >= 85 ? "#16a34a" : startup.trustScore >= 70 ? "#ca8a04" : "#dc2626"}
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(startup.trustScore / 100) * 351.86} 351.86`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(startup.trustScore)}`}>
                        {startup.trustScore}
                      </div>
                      <div className="text-xs text-[#605a57]">Trust Score</div>
                    </div>
                  </div>
                </div>
                <Badge variant={getRiskBadgeVariant(startup.riskLevel)}>
                  {startup.riskLevel.toUpperCase()} RISK
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "On-chain Evidence", score: startup.onChainScore, icon: Shield },
            { label: "Team Authenticity", score: startup.teamScore, icon: Users },
            { label: "GitHub Activity", score: startup.githubScore, icon: GitBranch },
            { label: "Community Signal", score: startup.communityScore, icon: TrendingUp },
            { label: "Document Verification", score: startup.documentScore, icon: FileText },
            { label: "Risk Flags", score: startup.riskLevel === "low" ? 95 : startup.riskLevel === "medium" ? 75 : 45, icon: AlertTriangle },
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="w-5 h-5 text-[#37322f]" />
                    <h3 className="font-semibold text-[#37322f]">{item.label}</h3>
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

        {/* Tabs Section */}
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="timeline">Provenance Timeline</TabsTrigger>
            <TabsTrigger value="ai-report">AI Report</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Provenance Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {startup.timeline.map((event, index) => {
                    const Icon = timelineIcons[event.type] || Calendar
                    return (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-[#37322f] flex items-center justify-center">
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          {index < startup.timeline.length - 1 && (
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

          <TabsContent value="ai-report" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">AI Authenticity & Risk Analysis Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div>
                  <h3 className="font-semibold text-[#37322f] mb-2">Summary</h3>
                  <p className="text-[#605a57]">{startup.aiReport.summary}</p>
                </div>

                {/* Success Likelihood */}
                <div>
                  <h3 className="font-semibold text-[#37322f] mb-2">Predicted Success Likelihood</h3>
                  <div className="flex items-center gap-4">
                    <Progress value={startup.aiReport.successLikelihood} className="flex-1" />
                    <span className={`text-2xl font-bold ${getScoreColor(startup.aiReport.successLikelihood)}`}>
                      {startup.aiReport.successLikelihood}%
                    </span>
                  </div>
                </div>

                {/* Strengths */}
                <div>
                  <h3 className="font-semibold text-[#37322f] mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {startup.aiReport.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span className="text-[#605a57]">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div>
                  <h3 className="font-semibold text-[#37322f] mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    Weaknesses
                  </h3>
                  <ul className="space-y-2">
                    {startup.aiReport.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-600 mt-1">•</span>
                        <span className="text-[#605a57]">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Red Flags */}
                {startup.aiReport.redFlags.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Red Flags
                    </h3>
                    <ul className="space-y-2">
                      {startup.aiReport.redFlags.map((flag, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-600 mt-1">⚠</span>
                          <span className="text-red-800">{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
