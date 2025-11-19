import { Link } from "react-router-dom"
import { WalletConnect } from "./WalletConnect"

export function Header() {
  const navItems = [
    { name: "Home", path: "/" },
    { name: "Verify Startup", path: "/verify" },
    { name: "Leaderboard", path: "/leaderboard" },
    { name: "About", path: "/about" },
    { name: "Admin", path: "/admin" },
  ]

  return (
    <header className="w-full border-b border-[#37322f]/6 bg-[#f7f5f3] sticky top-0 z-50">
      <div className="max-w-[1060px] mx-auto px-4">
        <nav className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-[#37322f] font-semibold text-lg">
              StartupSeal
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              {navItems.slice(1).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-[#37322f] hover:text-[#37322f]/80 text-sm font-medium transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <WalletConnect />
        </nav>
      </div>
    </header>
  )
}
