import React, { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { apiUrl } from '../api'

function ProfileLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    axios
      .get(apiUrl("/session_check"), { withCredentials: true })
      .then(res => {
        if (res.data.message !== 'Valid Token') navigate('/')
      })
      .catch(() => navigate('/'))
  }, [navigate])

  const isItinerary = location.pathname === "/dashboard"
  const isDetails = location.pathname === "/dashboard/details"
  const isChat = location.pathname === "/dashboard/chat"

  const handleLogout = async () => {
    try {
      const res = await axios.post(
        apiUrl("/logout"),
        {},
        { withCredentials: true }
      )
      console.log(res.data);
      console.log(res.data.message);
      if (res.data.message == "Logged out") navigate('/')
    } catch (error) {
      console.log("Logout error")
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f6f6f8]">
      {/* ══════════ SIDEBAR ══════════ */}
      <aside className="hidden md:flex w-72 flex-col border-r border-slate-200 bg-white">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 h-20 border-b border-slate-100">
          <div className="bg-primary p-1.5 rounded-lg text-white">
            <span className="material-symbols-outlined text-xl">travel_explore</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-lg font-extrabold tracking-tighter text-slate-900 uppercase"
          >
            TRAVELOGIQ
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col gap-2 p-4">
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${isItinerary
              ? 'bg-primary text-white shadow-lg shadow-primary/25'
              : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
              }`}
          >
            <span className="material-symbols-outlined text-xl">history</span>
            Previous Itineraries
          </button>

          <button
            onClick={() => navigate('/dashboard/details')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${isDetails
              ? 'bg-primary text-white shadow-lg shadow-primary/25'
              : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
              }`}
          >
            <span className="material-symbols-outlined text-xl">add_circle</span>
            Create New Itinerary
          </button>

          <button
            onClick={() => navigate('/dashboard/chat')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${isChat
              ? 'bg-primary text-white shadow-lg shadow-primary/25'
              : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
              }`}
          >
            <span className="material-symbols-outlined text-xl">smart_toy</span>
            AI Chat
          </button>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* ══════════ MOBILE TOP BAR ══════════ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-header border-b border-slate-200 h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1 rounded-lg text-white">
            <span className="material-symbols-outlined text-lg">travel_explore</span>
          </div>
          <span className="text-base font-extrabold tracking-tighter text-slate-900 uppercase">TRAVELOGIQ</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className={`p-2 rounded-lg ${isItinerary ? 'text-primary' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined">history</span>
          </button>
          <button
            onClick={() => navigate('/dashboard/details')}
            className={`p-2 rounded-lg ${isDetails ? 'text-primary' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined">add_circle</span>
          </button>
          <button
            onClick={() => navigate('/dashboard/chat')}
            className={`p-2 rounded-lg ${isChat ? 'text-primary' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined">smart_toy</span>
          </button>
          <button onClick={handleLogout} className="p-2 rounded-lg text-slate-500 hover:text-red-600">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <main className="flex-1 md:pt-0 pt-16 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default ProfileLayout

