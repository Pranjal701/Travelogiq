import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { apiUrl } from '../api'

function Home() {
  const navigate = useNavigate()
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false)
  const [homeText, setHomeText] = useState('')

  useEffect(() => {
    axios
      .get(apiUrl('/session_check'), { withCredentials: true })
      .then((res) => {
        if (res.data.message === 'Valid Token') {
          setHomeText('Generate Your Trip')
          setIsUserLoggedIn(true)
        } else {
          setHomeText('Generate Your 1st Trip')
          setIsUserLoggedIn(false)
        }
      })
      .catch(() => {
        setHomeText('Generate Your 1st Trip')
        setIsUserLoggedIn(false)
      })
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isUserLoggedIn) navigate('/dashboard/details')
    else navigate('/signIn')
  }

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      {/* ══════════ STICKY GLASS HEADER ══════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-header border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg text-white">
              <span className="material-symbols-outlined text-2xl">travel_explore</span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-xl font-extrabold tracking-tighter text-slate-900 uppercase"
            >
              TRAVELOGIQ
            </button>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-10">
            {isUserLoggedIn && (
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm font-semibold hover:text-primary transition-colors"
              >
                Dashboard
              </button>
            )}
          </nav>

          {/* Auth button */}
          <div className="flex items-center gap-4">
            {isUserLoggedIn ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-primary/25"
              >
                Profile
              </button>
            ) : (
              <button
                onClick={() => navigate('/logIn')}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-primary/25"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-20">
        {/* ══════════ HERO ══════════ */}
        <section className="relative min-h-[85vh] flex items-center justify-center px-6 py-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="/homeBG4.png"
              alt="Travel landscape"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-[#f6f6f8]" />
          </div>

          <div className="relative z-10 max-w-4xl text-center">
            <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold tracking-widest uppercase border border-white/20">
              Redefining Premium Travel
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight mb-8">
              Your Journey,
              <br />
              Intelligently Crafted.
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto font-medium">
              Experience the future of exploration. Our AI engine curates
              high-end itineraries tailored to your unique preferences.
            </p>
            <button
              onClick={handleSubmit}
              className="bg-primary hover:bg-primary/90 text-white px-10 py-5 rounded-xl text-lg font-bold shadow-2xl shadow-primary/40 transition-transform active:scale-95"
            >
              {homeText}
            </button>
          </div>
        </section>

        {/* ══════════ HOW IT WORKS ══════════ */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-3">
              Our Process
            </h2>
            <h3 className="text-4xl font-extrabold text-slate-900">
              How It Works
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white p-10 rounded-xl border border-primary/5 shadow-xl shadow-primary/5 hover:border-primary/20 transition-all group">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">edit_calendar</span>
              </div>
              <h4 className="text-2xl font-bold mb-4 text-slate-900">Plan</h4>
              <p className="text-slate-600 leading-relaxed">
                Input your dream destinations and travel dates. Our AI analyzes
                millions of data points to build your foundation.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-10 rounded-xl border border-primary/5 shadow-xl shadow-primary/5 hover:border-primary/20 transition-all group">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">tune</span>
              </div>
              <h4 className="text-2xl font-bold mb-4 text-slate-900">Personalize</h4>
              <p className="text-slate-600 leading-relaxed">
                Refine your experience. From dining preferences to pacing, we
                tailor every detail to match your sophisticated style.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-10 rounded-xl border border-primary/5 shadow-xl shadow-primary/5 hover:border-primary/20 transition-all group">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">flight_takeoff</span>
              </div>
              <h4 className="text-2xl font-bold mb-4 text-slate-900">Travel</h4>
              <p className="text-slate-600 leading-relaxed">
                Embark on a seamless journey with 24/7 digital assistance and a
                perfectly optimized itinerary at your fingertips.
              </p>
            </div>
          </div>
        </section>

        {/* ══════════ CTA SECTION ══════════ */}
        <section className="py-20 px-6 max-w-5xl mx-auto text-center">
          <div className="bg-primary rounded-xl p-12 text-white shadow-2xl shadow-primary/30">
            <h3 className="text-3xl font-bold mb-4">
              Ready to Plan Your Next Adventure?
            </h3>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Let our AI craft a personalized itinerary just for you — weather,
              hotels, and day-by-day activities included.
            </p>
            <button
              onClick={handleSubmit}
              className="bg-white text-primary px-8 py-3 rounded-lg font-bold hover:bg-slate-100 transition-colors"
            >
              {homeText || 'Get Started'}
            </button>
          </div>
        </section>
      </main>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="bg-slate-900 text-slate-400 py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-4 text-white">
              <span className="material-symbols-outlined">travel_explore</span>
              <h2 className="text-lg font-extrabold tracking-tighter uppercase">
                TRAVELOGIQ
              </h2>
            </div>
            <p className="text-sm text-center md:text-left max-w-xs">
              Intelligent travel planning for the modern adventurer. Crafting
              premium journeys with AI.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-800 text-center text-xs">
          © {new Date().getFullYear()} TRAVELOGIQ. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

export default Home
