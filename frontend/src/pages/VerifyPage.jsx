import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Upload, Sparkles, Github, X, CheckCircle2 } from "lucide-react"
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import { bcs } from "@mysten/sui/bcs"

// Contract addresses from environment
const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID
const SEAL_REGISTRY = import.meta.env.VITE_SEAL_REGISTRY
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID

export function VerifyPage() {
  const navigate = useNavigate()
  const currentAccount = useCurrentAccount()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  const suiClient = useSuiClient()
  
  const [formData, setFormData] = useState({
    startupName: "",
    description: "",
    hackathonName: "",
    githubRepo: "", // Format: owner/repo
  })
  
  const [logo, setLogo] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [files, setFiles] = useState([])
  
  const [githubAuth, setGithubAuth] = useState({
    authenticated: false,
    username: '',
    accessToken: '',
    repoVerification: null
  })
  
  const [uploadStatus, setUploadStatus] = useState({
    certificateBlobIds: [],
    loading: false,
    error: '',
    currentStep: '',
  })

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    
    console.log('🔍 Checking for OAuth callback...')
    console.log('   URL:', window.location.href)
    console.log('   Code present:', !!code)
    console.log('   State present:', !!state)
    
    if (code && state) {
      console.log('✅ OAuth callback detected')
      const savedState = sessionStorage.getItem('github_oauth_state')
      console.log('   Saved state:', savedState ? 'present' : 'missing')
      console.log('   States match:', state === savedState)
      
      if (state === savedState) {
        console.log('🚀 Completing GitHub authentication...')
        // Restore form data BEFORE completing auth
        const savedFormData = sessionStorage.getItem('saved_form_data')
        let repoName = ''
        if (savedFormData) {
          const parsedData = JSON.parse(savedFormData)
          setFormData(parsedData)
          repoName = parsedData.githubRepo
          console.log('✅ Form data restored, repo:', repoName)
        }
        // Complete auth with repo name
        completeGitHubAuth(code, repoName)
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
      } else {
        console.error('❌ State mismatch - possible CSRF attack')
        setUploadStatus(prev => ({ 
          ...prev, 
          error: 'Authentication failed: State mismatch. Please try again.',
          loading: false 
        }))
      }
    } else {
      console.log('ℹ️ No OAuth callback in URL')
    }
  }, [])

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setLogo(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files)
    setFiles([...files, ...uploadedFiles])
  }

  const handleConnectGithub = () => {
    if (!formData.githubRepo) {
      setUploadStatus(prev => ({ ...prev, error: 'Please enter GitHub repository name first (e.g., username/repo-name)' }))
      return
    }

    // Save form data before OAuth redirect
    sessionStorage.setItem('saved_form_data', JSON.stringify(formData))
    
    const state = Math.random().toString(36).substring(7)
    sessionStorage.setItem('github_oauth_state', state)
    sessionStorage.setItem('github_repo_target', formData.githubRepo)
    
    const scope = 'read:user,user:email,repo'
    const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI || (window.location.origin + '/verify')
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=${scope}&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`
    
    window.location.href = authUrl
  }

  const completeGitHubAuth = async (code, repoName) => {
    console.log('🔐 Starting GitHub authentication...')
    console.log('   Code:', code ? `${code.substring(0, 10)}...` : 'MISSING')
    console.log('   Repo name:', repoName)
    console.log('   API URL:', API_BASE_URL)
    
    setUploadStatus(prev => ({ ...prev, loading: true, currentStep: 'Authenticating with GitHub...', error: '' }))
    
    try {
      console.log('📤 Sending auth request to backend...')
      const response = await fetch(`${API_BASE_URL}/api/github/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      
      console.log('📥 Response status:', response.status)
      const data = await response.json()
      console.log('📥 Response data:', data)
      
      if (data.error) throw new Error(data.error)
      if (!data.access_token || !data.username) throw new Error('Invalid response from GitHub auth')

      setGithubAuth(prev => ({
        ...prev,
        authenticated: true,
        username: data.username,
        accessToken: data.access_token,
      }))

      setUploadStatus(prev => ({ 
        ...prev, 
        loading: false, 
        currentStep: 'GitHub connected! Verifying repository...',
        error: '' 
      }))

      // Verify repository with the repo name passed from OAuth callback
      await verifyRepositoryAccess(data.access_token, repoName)
    } catch (error) {
      console.error('GitHub auth error:', error)
      setUploadStatus(prev => ({ 
        ...prev,
        loading: false, 
        error: `GitHub authentication failed: ${error.message}`,
        currentStep: '' 
      }))
    }
  }

  const verifyRepositoryAccess = async (token, repoName) => {
    const accessToken = token || githubAuth.accessToken
    const repositoryName = repoName || formData.githubRepo
    
    if (!accessToken || !repositoryName) {
      setUploadStatus(prev => ({ ...prev, error: 'Please authorize GitHub and specify repository' }))
      return
    }

    setUploadStatus(prev => ({ 
      ...prev, 
      loading: true, 
      currentStep: 'Verifying repository access...',
      error: '' 
    }))

    try {
      const response = await fetch(`${API_BASE_URL}/api/github/verify-repository`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: accessToken,
          repo_full_name: repositoryName
        })
      })

      const verification = await response.json()
      
      if (verification.error) throw new Error(verification.error)
      if (!verification.has_access) throw new Error('You do not have access to this repository')

      setGithubAuth(prev => ({
        ...prev,
        repoVerification: verification
      }))

      setUploadStatus(prev => ({
        ...prev,
        loading: false,
        currentStep: 'Repository verified!',
        error: ''
      }))
    } catch (error) {
      console.error('Repository verification error:', error)
      setUploadStatus(prev => ({
        ...prev,
        loading: false,
        error: `Repository verification failed: ${error.message}`,
        currentStep: ''
      }))
    }
  }

  const handleDisconnectGithub = () => {
    setGithubAuth({
      authenticated: false,
      username: '',
      accessToken: '',
      repoVerification: null
    })
    setUploadStatus(prev => ({ ...prev, currentStep: '', error: '' }))
  }

  const handleGenerate = async () => {
    if (!currentAccount) {
      setUploadStatus(prev => ({ ...prev, error: 'Please connect your Sui wallet first' }))
      return
    }

    if (!githubAuth.authenticated || !githubAuth.repoVerification) {
      setUploadStatus(prev => ({ ...prev, error: 'Please verify your GitHub repository first' }))
      return
    }

    setUploadStatus(prev => ({ ...prev, loading: true, currentStep: 'Generating trust score...', error: '' }))
    
    try {
      // Upload certificates to Walrus if any
      let certificateBlobIds = []
      if (files.length > 0) {
        setUploadStatus(prev => ({ ...prev, currentStep: `Uploading ${files.length} certificate(s) to Walrus...` }))
        // TODO: Implement Walrus upload
        // For now, simulate upload
        console.log('📤 Uploading certificates:', files.map(f => f.name))
      }

      // Step 1: AI Analysis of the startup application
      setUploadStatus(prev => ({ ...prev, currentStep: '🤖 AI analyzing startup authenticity...' }))
      console.log('🤖 Starting AI analysis...')
      
      const analysisPayload = {
        startup_name: formData.startupName,
        wallet_address: currentAccount.address,
        github_access_token: githubAuth.accessToken,
        github_repo: formData.githubRepo,
        certificate_blob_ids: certificateBlobIds,
        metadata: {
          hackathon_name: formData.hackathonName,
          description: formData.description,
          logo_url: logo || '',
          team_size: formData.teamSize || 1,
          website: formData.website || ''
        }
      }

      console.log('📤 Sending to AI analysis endpoint:', analysisPayload)
      
      const analysisResponse = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisPayload)
      })

      if (!analysisResponse.ok) {
        throw new Error('AI analysis failed')
      }

      const aiAnalysisResult = await analysisResponse.json()
      console.log('🤖 AI Analysis Result:', aiAnalysisResult)

      // Extract AI-generated scores
      const hackathonScore = aiAnalysisResult.hackathon_score || (formData.hackathonName ? 70 : 0)
      const githubScore = aiAnalysisResult.github_score || 
        (githubAuth.repoVerification ? 
          Math.round((githubAuth.repoVerification.ownership_score * 0.6) + (githubAuth.repoVerification.activity_score * 0.4)) : 50)
      const aiScore = aiAnalysisResult.ai_consistency_score || 
        (githubAuth.repoVerification ? githubAuth.repoVerification.consistency_score : 50)
      const documentScore = aiAnalysisResult.document_score || (certificateBlobIds.length > 0 ? 80 : 50)

      console.log('📊 Final Scores:', { hackathonScore, githubScore, aiScore, documentScore })

      // Generate nonce and submission hash for security
      const nonce = Date.now() + Math.floor(Math.random() * 1000000)
      const submissionData = `${formData.startupName}-${formData.githubRepo}-${formData.hackathonName}-${nonce}`
      const submissionHashBytes = new Uint8Array(new TextEncoder().encode(submissionData))

      setUploadStatus(prev => ({ ...prev, currentStep: 'Creating blockchain transaction...' }))

      const tx = new Transaction()
      
      // Prepare arguments
      const nameBytes = Array.from(new TextEncoder().encode(formData.startupName))
      const repoBytes = Array.from(new TextEncoder().encode(formData.githubRepo))
      const hackathonBytes = Array.from(new TextEncoder().encode(formData.hackathonName || 'none'))
      
      // Certificate blob IDs as vector<vector<u8>>
      // For empty vector, pass empty array directly without BCS serialization
      let blobIdArg
      if (certificateBlobIds.length === 0) {
        // For empty nested vector, use pure with empty array
        blobIdArg = tx.pure(new Uint8Array([0])) // BCS encoding of empty vector
      } else {
        // Non-empty: convert each string to byte array
        const blobIdVectors = certificateBlobIds.map(id => 
          Array.from(new TextEncoder().encode(id))
        )
        console.log('📦 Blob ID vectors:', blobIdVectors)
        // Use BCS to serialize the nested vector
        blobIdArg = tx.pure(bcs.vector(bcs.vector(bcs.U8)).serialize(blobIdVectors))
      }
      
      const documentHashBytes = Array.from(new TextEncoder().encode(formData.description || 'none'))

      console.log('📝 Transaction parameters:', {
        name: formData.startupName,
        nameBytes: nameBytes.length,
        repo: formData.githubRepo,
        repoBytes: repoBytes.length,
        hackathon: formData.hackathonName || 'none',
        hackathonBytes: hackathonBytes.length,
        blobIds: certificateBlobIds.length,
        documentBytes: documentHashBytes.length,
        scores: { hackathonScore, githubScore, aiScore, documentScore },
        nonce
      })

      // Remove manual gas budget - let wallet auto-calculate
      // tx.setGasBudget(100000000)

      // Build transaction - EXACT order from Move contract
      tx.moveCall({
        target: `${PACKAGE_ID}::startup_seal::mint_startup_seal`,
        arguments: [
          tx.object(SEAL_REGISTRY),
          tx.pure.vector('u8', nameBytes),
          tx.pure.vector('u8', repoBytes),
          tx.pure.vector('u8', hackathonBytes),
          blobIdArg,
          tx.pure.vector('u8', documentHashBytes),
          tx.pure.u64(hackathonScore),
          tx.pure.u64(githubScore),
          tx.pure.u64(aiScore),
          tx.pure.u64(documentScore),
          tx.pure.u64(nonce),
          tx.pure.vector('u8', Array.from(submissionHashBytes)),
          tx.object('0x6')
        ]
      })

      setUploadStatus(prev => ({ ...prev, currentStep: '⏳ Waiting for wallet approval...' }))

      signAndExecuteTransaction(
        { 
          transaction: tx,
          options: {
            showEffects: true,
            showObjectChanges: true,
          }
        },
        {
          onSuccess: (result) => {
            const overallScore = Math.round(
              (hackathonScore * 0.4) + 
              (githubScore * 0.3) + 
              (aiScore * 0.2) + 
              (documentScore * 0.1)
            )

            console.log('✅ Transaction successful!', result)
            
            // Show detailed score breakdown
            const scoreBreakdown = `
🎯 Trust Score: ${overallScore}/100

📊 Score Breakdown:
• Hackathon Verification: ${hackathonScore}/100 (40% weight)
• GitHub Contribution: ${githubScore}/100 (30% weight)
• AI Consistency Check: ${aiScore}/100 (20% weight)
• Document Authenticity: ${documentScore}/100 (10% weight)

🔗 Transaction: ${result.digest}
${overallScore >= 70 ? '✅ Auto-verified! Your seal is ready to use.' : '⚠️ Score below 70%. Consider improving verification metrics.'}
            `.trim()

            setUploadStatus(prev => ({
              ...prev,
              loading: false,
              currentStep: `✅ Success! Trust Score: ${overallScore}/100`,
              error: '',
              aiAnalysis: aiAnalysisResult,
              scoreBreakdown: { hackathonScore, githubScore, aiScore, documentScore, overallScore }
            }))

            alert(scoreBreakdown)

            // Navigate to profile after a delay
            setTimeout(() => {
              navigate(`/profile/${result.digest}`)
            }, 3000)
          },
          onError: (error) => {
            console.error('❌ Transaction error:', error)
            console.error('Error details:', {
              message: error.message,
              code: error.code,
              stack: error.stack,
              fullError: JSON.stringify(error, null, 2)
            })
            
            const errorMessage = error.message || String(error)
            const isUserCancelled = errorMessage.includes('declined') || 
                                   errorMessage.includes('rejected') || 
                                   errorMessage.includes('User rejected') ||
                                   errorMessage.includes('cancelled')
            
            let friendlyMessage = errorMessage
            
            // Parse specific error types
            if (errorMessage.includes('Insufficient')) {
              friendlyMessage = 'Insufficient gas/funds. Please add more SUI to your wallet.'
            } else if (errorMessage.includes('nonce')) {
              friendlyMessage = 'Nonce validation failed. This submission may have been used before. Try again.'
            } else if (errorMessage.includes('duplicate')) {
              friendlyMessage = 'Duplicate submission detected. This startup may already be registered.'
            } else if (errorMessage.includes('400')) {
              friendlyMessage = 'Transaction validation failed. This may be due to a contract mismatch. Please check console for details.'
            }
            
            setUploadStatus(prev => ({
              ...prev,
              loading: false,
              error: isUserCancelled ? 'Transaction cancelled by user' : friendlyMessage,
              currentStep: ''
            }))
            
            if (!isUserCancelled) {
              alert(`❌ Transaction Failed\n\n${friendlyMessage}\n\nCheck console for technical details.`)
            }
          }
        }
      )
    } catch (error) {
      console.error('Verification error:', error)
      setUploadStatus(prev => ({
        ...prev,
        loading: false,
        error: `Verification failed: ${error.message}`,
        currentStep: ''
      }))
    }
  }

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-[900px] mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-[#37322f] text-5xl md:text-6xl font-serif mb-4">
            Verify Your Startup
          </h1>
          <p className="text-[#605a57] text-lg max-w-2xl mx-auto">
            Enter your startup details to generate a comprehensive trust score and verification report.
          </p>
        </div>

        {/* Status Messages */}
        {uploadStatus.error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600 text-sm">{uploadStatus.error}</p>
            </CardContent>
          </Card>
        )}
        
        {uploadStatus.currentStep && !uploadStatus.error && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-green-700 text-sm">{uploadStatus.currentStep}</p>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Startup Information</CardTitle>
            <CardDescription>
              Provide accurate information for the most reliable trust score.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Startup Name */}
            <div>
              <label className="block text-sm font-medium text-[#37322f] mb-2">
                Startup Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Enter your startup name..."
                value={formData.startupName}
                onChange={(e) => setFormData({ ...formData, startupName: e.target.value })}
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-[#37322f] mb-2">
                Startup Logo
              </label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <div className="relative w-20 h-20 rounded-lg border-2 border-[#e0dedb] overflow-hidden">
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setLogo(null); setLogoPreview(null) }}
                      className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                    >
                      <X className="w-3 h-3 text-[#37322f]" />
                    </button>
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload">
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {logo ? "Change Logo" : "Upload Logo"}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-[#605a57]/60 mt-1">
                    PNG, JPG, or SVG (Max 2MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Sui Wallet Address */}
            <div>
              <label className="block text-sm font-medium text-[#37322f] mb-2">
                Sui Wallet Address <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder={currentAccount?.address || "Connect your wallet first..."}
                value={currentAccount?.address || ""}
                disabled
                className="bg-secondary/50"
              />
              {!currentAccount && (
                <p className="text-xs text-[#605a57] mt-1">
                  Please connect your Sui wallet using the button in the header
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#37322f] mb-2">
                Startup Description <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Describe your startup, its mission, and what problem it solves..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[120px]"
              />
            </div>

            {/* GitHub Repository */}
            <div>
              <label className="block text-sm font-medium text-[#37322f] mb-2">
                GitHub Repository <span className="text-destructive">*</span>
              </label>
              {!githubAuth.authenticated ? (
                <>
                  <Input
                    placeholder="e.g., username/repo-name"
                    value={formData.githubRepo}
                    onChange={(e) => setFormData({ ...formData, githubRepo: e.target.value })}
                    className="mb-2"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleConnectGithub}
                    disabled={!formData.githubRepo || uploadStatus.loading}
                    className="w-full"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    Connect & Verify GitHub Repository
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border border-[#e0dedb] rounded-md bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <Github className="w-5 h-5 text-[#37322f]" />
                      <div>
                        <div className="text-sm text-[#37322f] font-medium">
                          {formData.githubRepo}
                        </div>
                        {githubAuth.repoVerification && (
                          <div className="text-xs text-[#605a57]">
                            Activity: {githubAuth.repoVerification.activity_score}/100 | 
                            Ownership: {githubAuth.repoVerification.ownership_score}/100
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleDisconnectGithub}>
                      Disconnect
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-xs text-[#605a57]/60 mt-1">
                Connect your GitHub to verify repository activity and commits
              </p>
            </div>

            {/* Hackathon Name */}
            <div>
              <label className="block text-sm font-medium text-[#37322f] mb-2">
                Hackathon Name <span className="text-[#605a57] text-xs font-normal">(Optional)</span>
              </label>
              <Input
                placeholder="e.g., ETHGlobal Bangkok 2024, Sui Overflow, DoraHacks"
                value={formData.hackathonName}
                onChange={(e) => setFormData({ ...formData, hackathonName: e.target.value })}
              />
            </div>

            {/* Additional Images/Documents */}
            <div>
              <label className="block text-sm font-medium text-[#37322f] mb-2">
                Additional Images & Documents <span className="text-[#605a57] text-xs font-normal">(Optional)</span>
              </label>
              <div className="border-2 border-dashed border-[#e0dedb] rounded-lg p-8 text-center hover:border-[#37322f]/20 transition-colors">
                <Upload className="w-10 h-10 mx-auto mb-4 text-[#605a57]" />
                <p className="text-[#605a57] mb-2">
                  Drop your files here or click to browse
                </p>
                <p className="text-sm text-[#605a57]/60 mb-4">
                  PDFs, images, pitch decks (Max 10MB each)
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.ppt,.pptx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" asChild>
                    <span>Browse Files</span>
                  </Button>
                </label>
              </div>
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-secondary rounded"
                    >
                      <span className="text-sm text-[#605a57]">{file.name}</span>
                      <button
                        onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        className="text-sm text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Analysis Progress Indicator */}
            {uploadStatus.loading && uploadStatus.currentStep && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
                    <div className="absolute inset-0 animate-ping opacity-25">
                      <Sparkles className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-purple-900">AI Analysis in Progress</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-purple-700 font-medium">{uploadStatus.currentStep}</span>
                    <span className="text-purple-500">⏳</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-purple-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse" 
                         style={{ width: '100%', animation: 'pulse 2s ease-in-out infinite' }}>
                    </div>
                  </div>

                  {uploadStatus.currentStep.includes('AI analyzing') && (
                    <div className="text-xs text-purple-600 bg-white/50 rounded p-3 mt-3">
                      <p className="font-medium mb-1">🔍 What's being analyzed:</p>
                      <ul className="space-y-1 ml-4 list-disc">
                        <li>GitHub repository authenticity</li>
                        <li>Commit history patterns</li>
                        <li>Code contribution consistency</li>
                        <li>Document verification</li>
                        <li>Cross-reference validation</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Score Breakdown Display (after successful analysis) */}
            {uploadStatus.scoreBreakdown && !uploadStatus.loading && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {uploadStatus.scoreBreakdown.overallScore}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Trust Score Generated!</h3>
                    <p className="text-sm text-green-700">AI analysis completed successfully</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-white/60 rounded p-3">
                    <div className="text-xs text-gray-600 mb-1">Hackathon (40%)</div>
                    <div className="text-xl font-bold text-gray-900">
                      {uploadStatus.scoreBreakdown.hackathonScore}/100
                    </div>
                  </div>
                  <div className="bg-white/60 rounded p-3">
                    <div className="text-xs text-gray-600 mb-1">GitHub (30%)</div>
                    <div className="text-xl font-bold text-gray-900">
                      {uploadStatus.scoreBreakdown.githubScore}/100
                    </div>
                  </div>
                  <div className="bg-white/60 rounded p-3">
                    <div className="text-xs text-gray-600 mb-1">AI Check (20%)</div>
                    <div className="text-xl font-bold text-gray-900">
                      {uploadStatus.scoreBreakdown.aiScore}/100
                    </div>
                  </div>
                  <div className="bg-white/60 rounded p-3">
                    <div className="text-xs text-gray-600 mb-1">Documents (10%)</div>
                    <div className="text-xl font-bold text-gray-900">
                      {uploadStatus.scoreBreakdown.documentScore}/100
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {uploadStatus.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">❌ {uploadStatus.error}</p>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!formData.startupName || !formData.description || !formData.githubRepo || 
                        !githubAuth.authenticated || !currentAccount || uploadStatus.loading}
              className="w-full h-12 text-base"
            >
              {uploadStatus.loading ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  {uploadStatus.currentStep || 'Processing...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Trust Score
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-[#37322f] mb-2 font-serif">~2 min</div>
              <p className="text-sm text-[#605a57]">Average verification time</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-[#37322f] mb-2 font-serif">100%</div>
              <p className="text-sm text-[#605a57]">Privacy protected</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-[#37322f] mb-2 font-serif">Free</div>
              <p className="text-sm text-[#605a57]">No cost to verify</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
