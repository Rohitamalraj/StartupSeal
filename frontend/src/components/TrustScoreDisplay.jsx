import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, Shield, Users, GitBranch, Activity } from "lucide-react"
import { getRiskLevelColor, getScoreColor } from "../services/trustOracleService"

/**
 * Trust Score Display Component
 * Displays AI-generated trust score with breakdown and evidence
 */
export function TrustScoreDisplay({ scoreData, className = "" }) {
  if (!scoreData) return null

  const { score, riskLevel, breakdown, evidence, mode, isDevMode } = scoreData

  // Get risk level icon and styling
  const getRiskIcon = () => {
    switch (riskLevel?.toLowerCase()) {
      case 'low':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />
      case 'medium':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />
      case 'high':
        return <XCircle className="w-6 h-6 text-red-600" />
      default:
        return <Activity className="w-6 h-6 text-gray-600" />
    }
  }

  // Category icons mapping
  const categoryIcons = {
    media_authenticity: <Shield className="w-5 h-5" />,
    tech_credibility: <GitBranch className="w-5 h-5" />,
    governance: <Users className="w-5 h-5" />,
    governance_transparency: <Users className="w-5 h-5" />,
    onchain_behavior: <Activity className="w-5 h-5" />,
    social_signals: <TrendingUp className="w-5 h-5" />,
  }

  // Format category names for display
  const formatCategoryName = (key) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dev Mode Banner */}
      {isDevMode && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900">Development Mode</p>
              <p className="text-sm text-blue-700">
                Using mock enclave with deterministic signatures. Production mode will use AWS Nitro Enclaves.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Score Card */}
      <Card className="border-2">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl">AI Trust Score</CardTitle>
          <CardDescription>Powered by Nautilus Confidential Computing</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Large Score Display */}
          <div className="text-center mb-6">
            <div className={`text-7xl font-bold mb-4 ${getScoreColor(score)}`}>
              {score}
              <span className="text-3xl text-gray-400">/100</span>
            </div>
            
            {/* Risk Level Badge */}
            <div className="flex items-center justify-center gap-2">
              {getRiskIcon()}
              <Badge 
                variant="outline" 
                className={`text-lg px-4 py-2 ${getRiskLevelColor(riskLevel)}`}
              >
                {riskLevel?.toUpperCase()} RISK
              </Badge>
            </div>
          </div>

          {/* Score Breakdown Grid */}
          {breakdown && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-gray-700">Category Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(breakdown).map(([category, value]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {categoryIcons[category] || <Activity className="w-5 h-5" />}
                        <span className="text-sm font-medium text-gray-700">
                          {formatCategoryName(category)}
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${getScoreColor(value)}`}>
                        {value}
                      </span>
                    </div>
                    <Progress value={value} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence List */}
          {evidence && evidence.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-semibold text-lg text-gray-700">Supporting Evidence</h4>
              <div className="space-y-2">
                {evidence.map((item, index) => {
                  // Handle both string and object evidence formats
                  const evidenceText = typeof item === 'string' ? item : item.finding || item.category || JSON.stringify(item);
                  const confidence = typeof item === 'object' && item.confidence ? Math.round(item.confidence * 100) : null;
                  
                  return (
                    <div 
                      key={index} 
                      className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{evidenceText}</p>
                        {confidence && (
                          <p className="text-xs text-gray-500 mt-1">Confidence: {confidence}%</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold text-gray-900">{score}</p>
            <p className="text-xs text-gray-500">Trust Score</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold text-gray-900">
              {Object.keys(breakdown || {}).length}
            </p>
            <p className="text-xs text-gray-500">Categories</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-gray-900">
              {evidence?.length || 0}
            </p>
            <p className="text-xs text-gray-500">Evidence Items</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            {getRiskIcon()}
            <p className="text-lg font-bold text-gray-900 mt-2">
              {riskLevel?.toUpperCase()}
            </p>
            <p className="text-xs text-gray-500">Risk Level</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
