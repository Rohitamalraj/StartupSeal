import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Upload, Search, Sparkles, Github, X } from "lucide-react"
import { useCurrentAccount } from "@mysten/dapp-kit"

export function VerifyPage() {
  const navigate = useNavigate()
  const currentAccount = useCurrentAccount()
  const [formData, setFormData] = useState({
    startupName: "",
    description: "",
    hackathon: "",
    githubUrl: "",
  })
  const [logo, setLogo] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [files, setFiles] = useState([])
  const [isGithubConnected, setIsGithubConnected] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

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
    // Simulate GitHub OAuth flow
    setIsGithubConnected(true)
    setFormData({ ...formData, githubUrl: "https://github.com/" + formData.startupName.toLowerCase().replace(/\s+/g, '-') })
  }

  const handleDisconnectGithub = () => {
    setIsGithubConnected(false)
    setFormData({ ...formData, githubUrl: "" })
  }

  const handleGenerate = () => {
    setIsGenerating(true)
    // Simulate verification process
    setTimeout(() => {
      setIsGenerating(false)
      // Navigate to profile of first startup (mock behavior)
      navigate("/profile/1")
    }, 2000)
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

            {/* Hackathon Name */}
            <div>
              <label className="block text-sm font-medium text-[#37322f] mb-2">
                Hackathon Name <span className="text-[#605a57] text-xs font-normal">(Optional)</span>
              </label>
              <Input
                placeholder="Enter the hackathon name..."
                value={formData.hackathon}
                onChange={(e) => setFormData({ ...formData, hackathon: e.target.value })}
              />
            </div>

            {/* Connect GitHub */}
            <div>
              <label className="block text-sm font-medium text-[#37322f] mb-2">
                GitHub Repository
              </label>
              {isGithubConnected ? (
                <div className="flex items-center justify-between p-3 border border-[#e0dedb] rounded-md bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <Github className="w-5 h-5 text-[#37322f]" />
                    <span className="text-sm text-[#37322f]">{formData.githubUrl}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleDisconnectGithub}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={handleConnectGithub} className="w-full">
                  <Github className="w-4 h-4 mr-2" />
                  Connect GitHub Repository
                </Button>
              )}
              <p className="text-xs text-[#605a57]/60 mt-1">
                Connect your GitHub to verify repository activity and commits
              </p>
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

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!formData.startupName || !formData.description || !currentAccount || isGenerating}
              className="w-full h-12 text-base"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  Generating Trust Score...
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
