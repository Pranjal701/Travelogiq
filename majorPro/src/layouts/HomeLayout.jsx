import React from 'react'
import { Outlet } from 'react-router-dom'

const HomeLayout = () => {
  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      <Outlet />
    </div>
  )
}

export default HomeLayout
