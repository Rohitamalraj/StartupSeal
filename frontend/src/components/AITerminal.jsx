import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Terminal, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'

export function AITerminal({ logs = [], isAnalyzing = false, trustScore = null }) {
  const [displayedLogs, setDisplayedLogs] = useState([])
  const terminalRef = useRef(null)
  
  useEffect(() => {
    if (logs.length > 0) {
      // Animate logs appearing one by one
      logs.forEach((log, index) => {
        setTimeout(() => {
          setDisplayedLogs(prev => [...prev, log])
        }, index * 300)
      })
    }
  }, [logs])
  
  useEffect(() => {
    // Auto-scroll to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [displayedLogs])
  
  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-500'
      case 'error': return 'text-red-500'
      case 'warning': return 'text-yellow-500'
      case 'info': return 'text-blue-500'
      case 'ai': return 'text-purple-500'
      default: return 'text-gray-400'
    }
  }
  
  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return '✓'
      case 'error': return '✗'
      case 'warning': return '⚠'
      case 'info': return 'ℹ'
      case 'ai': return '🤖'
      default: return '▸'
    }
  }
  
  return (
    <Card className="border-2 border-purple-200 bg-[#1a1a2e]">
      <CardHeader className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-b border-purple-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-400" />
            AI Analysis Terminal
            {isAnalyzing && (
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            )}
          </CardTitle>
          {trustScore && (
            <Badge 
              variant={trustScore.score >= 70 ? "success" : trustScore.score >= 40 ? "warning" : "danger"}
              className="text-lg px-4 py-1"
            >
              Score: {trustScore.score}/100
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={terminalRef}
          className="font-mono text-sm h-[400px] overflow-y-auto p-4 space-y-1"
          style={{ 
            backgroundColor: '#0d1117',
            scrollBehavior: 'smooth'
          }}
        >
          {displayedLogs.length === 0 && !isAnalyzing && (
            <div className="text-gray-500 text-center py-20">
              <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Waiting for AI analysis...</p>
            </div>
          )}
          
          {displayedLogs.map((log, index) => (
            <div 
              key={index} 
              className={`flex items-start gap-2 ${getLogColor(log.type)} transition-all duration-300`}
            >
              <span className="opacity-70">{getLogIcon(log.type)}</span>
              <span className="flex-1">{log.message}</span>
              {log.timestamp && (
                <span className="text-gray-600 text-xs">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
          ))}
          
          {isAnalyzing && (
            <div className="flex items-center gap-2 text-purple-400 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>AI analyzing data...</span>
            </div>
          )}
          
          {trustScore && (
            <div className="mt-4 p-4 bg-purple-900/20 rounded-lg border border-purple-700">
              <div className="text-white font-bold mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                Analysis Complete
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-gray-300">
                  Trust Score: <span className="text-white font-bold">{trustScore.score}/100</span>
                </div>
                <div className="text-gray-300">
                  Risk Level: <span className={`font-bold ${
                    trustScore.riskLevel === 'low' ? 'text-green-400' :
                    trustScore.riskLevel === 'medium' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>{trustScore.riskLevel?.toUpperCase()}</span>
                </div>
                <div className="text-gray-300">
                  Confidence: <span className="text-white font-bold">
                    {(trustScore.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                
                {trustScore.categoryScores && Object.keys(trustScore.categoryScores).length > 0 && (
                  <div className="mt-3 space-y-1">
                    <div className="text-gray-400 text-xs font-bold">Category Breakdown:</div>
                    {Object.entries(trustScore.categoryScores)
                      .filter(([, data]) => data !== null && data !== undefined)
                      .map(([category, data]) => (
                        <div key={category} className="flex justify-between text-xs">
                          <span className="text-gray-400 capitalize">
                            {category.replace(/_/g, ' ')}:
                          </span>
                          <span className="text-white">
                            {typeof data === 'object' && data !== null ? data.score || 0 : data || 0}/100
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
