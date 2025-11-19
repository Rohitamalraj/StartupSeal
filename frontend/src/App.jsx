import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { SuiProvider } from './components/SuiProvider'
import { HomePage } from "./pages/HomePage"
import { VerifyPage } from "./pages/VerifyPage"
import { ProfilePage } from "./pages/ProfilePage"
import { LeaderboardPage } from "./pages/LeaderboardPage"
import { AdminPage } from "./pages/AdminPage"
import { AboutPage } from "./pages/AboutPage"
import { FundraisePage } from "./pages/FundraisePage"
import '@mysten/dapp-kit/dist/index.css'

function App() {
  return (
    <SuiProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/fundraise" element={<FundraisePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/about" element={<AboutPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </SuiProvider>
  )
}

export default App
