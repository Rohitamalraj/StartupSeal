import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Shield, FileCheck, GitBranch, Users, TrendingUp, Lock, Sparkles, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import Squares from "../components/ui/squares"

export function HomePage() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "AI-Powered Trust Score",
      description: "Advanced machine learning algorithms analyze multiple data points to generate comprehensive credibility scores.",
    },
    {
      icon: <FileCheck className="w-8 h-8" />,
      title: "On-chain Verification",
      description: "Immutable proof of hackathon participation, deployments, and milestone achievements recorded on-chain.",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Hackathon Provenance",
      description: "Verifiable certificates and credentials from recognized Web3 hackathons via Nautilus integration.",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Credentialed Team Identity",
      description: "Zero-knowledge proofs verify team member authenticity while preserving privacy.",
    },
  ]

  const whyMatters = [
    {
      title: "For Investors & VCs",
      points: [
        "Reduce due diligence time by 80%",
        "Identify high-potential projects early",
        "Avoid fraudulent or exaggerated claims"
      ]
    },
    {
      title: "For Accelerators",
      points: [
        "Select genuinely innovative startups",
        "Track portfolio company progress",
        "Access verified hackathon alumni"
      ]
    },
    {
      title: "For Users",
      points: [
        "Discover trustworthy Web3 projects",
        "Avoid scams and rug pulls",
        "Support legitimate innovation"
      ]
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-[216px] pb-16 overflow-hidden">
        {/* Animated Squares Background */}
        <div className="absolute inset-0 z-0">
          <Squares 
            speed={0.5}
            squareSize={40}
            direction="diagonal"
            borderColor="rgba(55, 50, 47, 0.1)"
            hoverFillColor="rgba(55, 50, 47, 0.05)"
          />
        </div>
        
        <div className="max-w-[1060px] mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center gap-12">
            <motion.div 
              className="max-w-[937px] flex flex-col items-center gap-3"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <div className="flex flex-col items-center gap-6">
                <motion.h1 
                  className="max-w-[800px] text-center text-[#37322f] text-5xl md:text-[80px] font-normal leading-tight md:leading-[96px] font-serif"
                  variants={fadeInUp}
                  transition={{ duration: 0.6 }}
                >
                  StartupSeal: A Seal of Authenticity for Web3 Startups
                </motion.h1>
                <motion.p 
                  className="max-w-[600px] text-center text-[#37322f]/80 text-lg font-medium leading-7"
                  variants={fadeInUp}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Verify the authenticity, transparency, and legitimacy of Web3 hackathon startups through 
                  AI-driven analysis and on-chain proof.
                </motion.p>
              </div>
            </motion.div>

            <motion.div 
              className="flex gap-4 flex-wrap justify-center"
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link to="/verify">
                <Button className="h-10 px-12 bg-[#37322f] hover:bg-[#37322f]/90 text-white rounded-full font-medium text-sm shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset]">
                  Verify a Startup
                </Button>
              </Link>
              <Link to="/leaderboard">
                <Button variant="outline" className="h-10 px-12 rounded-full font-medium text-sm">
                  See Ranked Startups
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t border-[#e0dedb] border-b border-[#e0dedb]">
        <div className="max-w-[1060px] mx-auto px-4">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
              >
                <div className={`p-6 flex flex-col gap-2 ${
                  index === 0 ? "bg-white border border-[#e0dedb] shadow-sm" : "border border-[#e0dedb]/80"
                }`}>
                  {index === 0 && (
                    <div className="space-y-1 mb-2">
                      <div className="w-full h-0.5 bg-[#322d2b]/8"></div>
                      <div className="w-32 h-0.5 bg-[#322d2b]"></div>
                    </div>
                  )}
                  <div className="text-[#37322f] mb-4">{feature.icon}</div>
                  <h3 className="text-[#49423d] text-sm font-semibold leading-6 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[#605a57] text-sm leading-[22px]">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Authenticity Matters */}
      <section className="py-20 bg-white">
        <div className="max-w-[1060px] mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-[#37322f] text-4xl md:text-5xl font-serif mb-4">
              Why Provable Authenticity Matters?
            </h2>
            <p className="text-[#605a57] text-lg max-w-2xl mx-auto">
              In the Web3 ecosystem, trust is everything. Our platform ensures you can verify 
              claims and make informed decisions.
            </p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {whyMatters.map((section, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-[#37322f] text-xl font-semibold mb-4">
                      {section.title}
                    </h3>
                    <ul className="space-y-3">
                      {section.points.map((point, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-[#605a57] text-sm">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-[#e0dedb] py-16">
        <div className="max-w-[1060px] mx-auto px-4">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {[
              { label: "Startups Verified", value: "500+" },
              { label: "Hackathons Covered", value: "50+" },
              { label: "Trust Score Accuracy", value: "94%" },
              { label: "Community Members", value: "10K+" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                transition={{ duration: 0.4 }}
              >
                <div className="text-4xl font-bold text-[#37322f] mb-2 font-serif">
                  {stat.value}
                </div>
                <div className="text-[#605a57] text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-[1060px] mx-auto px-4 text-center">
          <h2 className="text-[#37322f] text-4xl md:text-5xl font-serif mb-6">
            Ready to verify your startup?
          </h2>
          <p className="text-[#605a57] text-lg mb-8 max-w-2xl mx-auto">
            Join the future of trustworthy Web3 innovation. Get your trust score today.
          </p>
          <Link to="/verify">
            <Button size="lg" className="h-12 px-16">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
