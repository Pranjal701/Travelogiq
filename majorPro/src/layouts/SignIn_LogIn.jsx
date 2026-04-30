import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

function SignIn_LogIn() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#f6f6f8]">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/signIN1.png"
          alt="background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/50" />
      </div>

      {/* Card */}
      <div className="flex w-full max-w-[920px] mx-4 min-h-[540px] rounded-2xl shadow-2xl overflow-hidden">
        {/* Left branding panel */}
        <div className="hidden md:flex w-1/2 flex-col items-center justify-center bg-primary p-10 text-white">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-3xl">travel_explore</span>
            <span className="text-2xl font-extrabold tracking-tighter uppercase">TRAVELOGIQ</span>
          </div>
          <h1 className="font-bold text-4xl mb-3 text-center">Welcome</h1>
          <p className="font-light text-lg tracking-wider text-white/80 text-center">
            Start Your Journey Here
          </p>
        </div>

        {/* Right form panel */}
        <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-8">
          {/* Mobile-only logo */}
          <button
            onClick={() => navigate('/')}
            className="md:hidden mb-6 text-xl font-extrabold tracking-tighter text-slate-900 uppercase"
          >
            TRAVELOGIQ
          </button>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default SignIn_LogIn
