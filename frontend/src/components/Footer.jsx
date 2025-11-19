import { Link } from "react-router-dom"
import { Shield, Twitter, Github, MessageCircle } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-[#e0dedb] bg-white mt-auto">
      <div className="max-w-[1060px] mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-[#37322f]" />
              <span className="text-[#37322f] font-semibold font-serif">
                StartupSeal
              </span>
            </div>
            <p className="text-sm text-[#605a57]">
              A "seal of authenticity" for Web3 startups
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[#37322f] mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/verify" className="text-sm text-[#605a57] hover:text-[#37322f]">
                  Verify Startup
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-sm text-[#605a57] hover:text-[#37322f]">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-[#605a57] hover:text-[#37322f]">
                  How it Works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#37322f] mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-[#605a57] hover:text-[#37322f]">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-[#605a57] hover:text-[#37322f]">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-[#605a57] hover:text-[#37322f]">
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#37322f] mb-4">Community</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-[#605a57] hover:text-[#37322f]">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-[#605a57] hover:text-[#37322f]">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-[#605a57] hover:text-[#37322f]">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[#e0dedb] mt-8 pt-8 text-center">
          <p className="text-sm text-[#605a57]">
            © 2024 StartupSeal. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
