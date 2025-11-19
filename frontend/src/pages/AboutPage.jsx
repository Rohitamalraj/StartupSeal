import { Card, CardContent } from "../components/ui/card"
import { Shield, CheckCircle2, Sparkles, Lock, GitBranch } from "lucide-react"

export function AboutPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="max-w-[900px] mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-[#37322f] text-5xl md:text-6xl font-serif mb-4">
            About StartupSeal
          </h1>
          <p className="text-[#605a57] text-lg max-w-2xl mx-auto">
            A "seal of authenticity" for Web3 startups through provable verification and AI-driven analysis.
          </p>
        </div>

        {/* Mission */}
        <Card className="mb-8">
          <CardContent className="pt-8">
            <h2 className="text-2xl font-serif text-[#37322f] mb-4">Our Mission</h2>
            <p className="text-[#605a57] leading-relaxed">
              The Web3 space is filled with innovation, but also with uncertainty. Investors, users, and 
              ecosystem partners need reliable ways to distinguish legitimate projects from fraudulent ones. 
              StartupSeal provides a comprehensive, AI-powered platform that verifies the authenticity, 
              transparency, and legitimacy of Web3 hackathon startups through multiple data sources and 
              on-chain proofs, giving them a verifiable seal of authenticity.
            </p>
          </CardContent>
        </Card>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-3xl font-serif text-[#37322f] mb-8 text-center">How It Works</h2>
          <div className="space-y-6">
            {[
              {
                icon: <Shield className="w-8 h-8" />,
                title: "On-chain Proof Collection",
                description: "We analyze on-chain data including smart contract deployments, transaction history, and hackathon participation certificates to verify provenance.",
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: "AI-Driven Analysis",
                description: "Our advanced machine learning models analyze multiple signals including GitHub activity, community engagement, and documentation quality to generate credibility scores.",
              },
              {
                icon: <CheckCircle2 className="w-8 h-8" />,
                title: "Verifiable Credentials",
                description: "We integrate with Nautilus and other credential platforms to verify hackathon certificates and team identities using zero-knowledge proofs.",
              },
              {
                icon: <Lock className="w-8 h-8" />,
                title: "Transparent Audits",
                description: "All verification results are stored in decentralized storage with cryptographic proofs, ensuring transparency and immutability.",
              },
              {
                icon: <GitBranch className="w-8 h-8" />,
                title: "GitHub Authenticity",
                description: "We verify repository authenticity, commit history, and contributor identities to ensure genuine development activity.",
              },
            ].map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="text-[#37322f] flex-shrink-0">{item.icon}</div>
                    <div>
                      <h3 className="font-semibold text-[#37322f] mb-2">{item.title}</h3>
                      <p className="text-[#605a57] text-sm">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Trust Score Components */}
        <Card className="mb-8">
          <CardContent className="pt-8">
            <h2 className="text-2xl font-serif text-[#37322f] mb-6">Trust Score Components</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#e0dedb]">
                <span className="text-[#605a57]">On-chain Evidence</span>
                <span className="font-semibold text-[#37322f]">20%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#e0dedb]">
                <span className="text-[#605a57]">Team Authenticity</span>
                <span className="font-semibold text-[#37322f]">20%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#e0dedb]">
                <span className="text-[#605a57]">GitHub Activity</span>
                <span className="font-semibold text-[#37322f]">20%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#e0dedb]">
                <span className="text-[#605a57]">Community Signal</span>
                <span className="font-semibold text-[#37322f]">15%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#e0dedb]">
                <span className="text-[#605a57]">Document Verification</span>
                <span className="font-semibold text-[#37322f]">15%</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-[#605a57]">Risk Assessment</span>
                <span className="font-semibold text-[#37322f]">10%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Use Cases */}
        <div className="mb-12">
          <h2 className="text-3xl font-serif text-[#37322f] mb-8 text-center">Who Uses StartupSeal?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Investors & VCs",
                points: ["Quick due diligence", "Risk assessment", "Portfolio tracking"],
              },
              {
                title: "Accelerators",
                points: ["Startup selection", "Progress monitoring", "Alumni verification"],
              },
              {
                title: "Ecosystem Partners",
                points: ["Integration decisions", "Partnership validation", "Grant allocation"],
              },
              {
                title: "End Users",
                points: ["Project discovery", "Scam avoidance", "Informed participation"],
              },
            ].map((useCase, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-[#37322f] mb-3">{useCase.title}</h3>
                  <ul className="space-y-2">
                    {useCase.points.map((point, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-[#605a57] text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
