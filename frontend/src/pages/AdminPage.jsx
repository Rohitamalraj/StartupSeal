import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Upload, RefreshCw, CheckCircle2, AlertTriangle, Shield } from "lucide-react"
import { useStore } from "../store/useStore"

export function AdminPage() {
  const startups = useStore((state) => state.startups)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const flaggedStartups = startups.filter(s => s.aiReport.redFlags.length > 0)

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    setUploadedFiles([...uploadedFiles, ...files])
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-[#37322f]" />
            <h1 className="text-[#37322f] text-5xl font-serif">Admin Dashboard</h1>
          </div>
          <p className="text-[#605a57] text-lg">
            Manage hackathon certificates, credentials, and startup verifications.
          </p>
        </div>

        <Tabs defaultValue="certificates" className="w-full">
          <TabsList className="w-full justify-start mb-6">
            <TabsTrigger value="certificates">Hackathon Certificates</TabsTrigger>
            <TabsTrigger value="credentials">Manage Credentials</TabsTrigger>
            <TabsTrigger value="flagged">Flagged Startups</TabsTrigger>
            <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
          </TabsList>

          {/* Upload Certificates */}
          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <CardTitle>Upload Hackathon Certificate Schemas</CardTitle>
                <CardDescription>
                  Upload verifiable credential schemas for hackathon certificates to enable automated verification.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-[#e0dedb] rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-[#605a57]" />
                  <p className="text-[#605a57] mb-2">
                    Drop certificate schema files here or click to browse
                  </p>
                  <p className="text-sm text-[#605a57]/60 mb-4">
                    Supported formats: JSON, JSONLD (Max 5MB)
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".json,.jsonld"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="schema-upload"
                  />
                  <label htmlFor="schema-upload">
                    <Button variant="outline" asChild>
                      <span>Browse Files</span>
                    </Button>
                  </label>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-[#37322f]">Uploaded Schemas</h4>
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-[#605a57]">{file.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-[#37322f] mb-2 font-serif">12</div>
                      <p className="text-sm text-[#605a57]">Active Schemas</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-[#37322f] mb-2 font-serif">50+</div>
                      <p className="text-sm text-[#605a57]">Hackathons Covered</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-[#37322f] mb-2 font-serif">500+</div>
                      <p className="text-sm text-[#605a57]">Verified Certificates</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Credentials */}
          <TabsContent value="credentials">
            <Card>
              <CardHeader>
                <CardTitle>Verifiable Credentials Management</CardTitle>
                <CardDescription>
                  Configure and manage verifiable credentials for team identity verification.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#37322f] mb-2">
                      DID Method
                    </label>
                    <Input placeholder="did:web:example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#37322f] mb-2">
                      Issuer DID
                    </label>
                    <Input placeholder="did:web:trustengine.io" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#37322f] mb-2">
                      Verification Registry Contract
                    </label>
                    <Input placeholder="0x..." />
                  </div>
                  <Button className="w-full">Save Configuration</Button>
                </div>

                <div className="border-t border-[#e0dedb] pt-6 mt-6">
                  <h4 className="font-semibold text-[#37322f] mb-4">Recent Credentials Issued</h4>
                  <div className="space-y-2">
                    {[
                      { name: "Team Identity - DeFiChain Protocol", date: "2024-11-15", status: "Active" },
                      { name: "Team Identity - ZKProof Identity", date: "2024-11-18", status: "Active" },
                      { name: "Team Identity - GameFi Arena", date: "2024-11-12", status: "Pending" },
                    ].map((cred, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white border border-[#e0dedb] rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-[#37322f]">{cred.name}</div>
                          <div className="text-sm text-[#605a57]">{cred.date}</div>
                        </div>
                        <Badge variant={cred.status === "Active" ? "success" : "warning"}>
                          {cred.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flagged Startups */}
          <TabsContent value="flagged">
            <Card>
              <CardHeader>
                <CardTitle>Flagged Startups</CardTitle>
                <CardDescription>
                  Review and manage startups with identified risk flags.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {flaggedStartups.length === 0 ? (
                    <div className="text-center py-12 text-[#605a57]">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-600" />
                      <p>No flagged startups at the moment.</p>
                    </div>
                  ) : (
                    flaggedStartups.map((startup) => (
                      <div
                        key={startup.id}
                        className="border border-red-200 bg-red-50 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={startup.logo}
                              alt={startup.name}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                            <div>
                              <h4 className="font-semibold text-[#37322f]">{startup.name}</h4>
                              <Badge variant="danger">HIGH RISK</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">Review</Button>
                            <Button size="sm">Re-analyze</Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {startup.aiReport.redFlags.map((flag, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-red-800">{flag}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Analysis */}
          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis Management</CardTitle>
                <CardDescription>
                  Re-run AI analysis and approve verified projects.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border border-[#e0dedb] rounded-lg p-6">
                  <h4 className="font-semibold text-[#37322f] mb-4">Bulk AI Re-analysis</h4>
                  <p className="text-sm text-[#605a57] mb-4">
                    Re-run AI credibility analysis for all startups or selected categories.
                  </p>
                  <div className="flex gap-4">
                    <Button variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Re-analyze All
                    </Button>
                    <Button variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Re-analyze Flagged
                    </Button>
                  </div>
                </div>

                <div className="border border-[#e0dedb] rounded-lg p-6">
                  <h4 className="font-semibold text-[#37322f] mb-4">Approve Verified Projects</h4>
                  <div className="space-y-3">
                    {startups.slice(0, 3).map((startup) => (
                      <div
                        key={startup.id}
                        className="flex items-center justify-between p-3 bg-white border border-[#e0dedb] rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={startup.logo}
                            alt={startup.name}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                          <div>
                            <div className="font-medium text-[#37322f]">{startup.name}</div>
                            <div className="text-sm text-[#605a57]">
                              Trust Score: <span className="font-semibold">{startup.trustScore}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">Reject</Button>
                          <Button size="sm">
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
