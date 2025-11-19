import { Link } from "react-router-dom"
import { WalletConnect } from "./WalletConnect"

export function Header() {
  return (
    <header className="w-full border-b border-[#37322f]/6 bg-[#f7f5f3]">
      <div className="max-w-[1060px] mx-auto px-4">
        <nav className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-[#37322f] font-semibold text-lg">
              StartupSeal
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/verify"
                className="text-[#37322f] hover:text-[#37322f]/80 text-sm font-medium transition-colors"
              >
                Verify Startup
              </Link>
              <Link
                to="/leaderboard"
                className="text-[#37322f] hover:text-[#37322f]/80 text-sm font-medium transition-colors"
              >
                Leaderboard
              </Link>
              <Link
                to="/fundraise"
                className="text-[#37322f] hover:text-[#37322f]/80 text-sm font-medium transition-colors"
              >
                Fundraise
              </Link>
              <Link
                to="/about"
                className="text-[#37322f] hover:text-[#37322f]/80 text-sm font-medium transition-colors"
              >
                About
              </Link>
              <Link
                to="/admin"
                className="text-[#37322f] hover:text-[#37322f]/80 text-sm font-medium transition-colors"
              >
                Admin
              </Link>
            </div>
          </div>
          <WalletConnect />
        </nav>
      </div>
    </header>
  )
}
