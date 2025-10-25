// Layout.js (fixed)
import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  Car,
  Users,
  Wrench,
  Receipt,
  Bell,
  BarChart2,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  FileText
} from 'lucide-react';
import motorDesk from "../../public/Motor desk.png";


export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const menu = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/clients', label: 'Clients', icon: Users },
    { to: '/services', label: 'Services', icon: Wrench },
    { to: '/billing', label: 'Billing', icon: Receipt },
    { to: '/reminders', label: 'Reminders', icon: Bell },
    { to: '/reports', label: 'Reports', icon: BarChart2 },
    { to: '/details', label: 'Details', icon: FileText },
  ]

  const logout = () => {
    localStorage.removeItem('auth')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
  fixed top-0 left-0 z-50 w-64 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out
  lg:translate-x-0
  ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
`}>

        <div className="flex flex-col h-screen">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br rounded-lg flex items-center justify-center">
                <img
                  src="/Motor desk.png"
                  alt="Motor Desk Logo"
                  className="w-10 h-10"
                />
              </div>
              <div className="font-poppins font-bold text-slate-800 text-2xl">
  Motor Desk
</div>

            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menu.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `
                  flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}
                  `
                }
              >
                {({ isActive }) => {
                  const Icon = item.icon
                  return (
                    <>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </>
                  )
                }}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={logout}
              className="
      w-full flex items-center justify-center gap-2
      px-4 py-3
      rounded-xl font-medium
      text-[#ff0000]
      bg-red-100
      hover:bg-red-200/50
      backdrop-blur
      border border-red-200/50
      shadow-sm hover:shadow-md
      transition-all duration-200
    "
            >
              <LogOut className="w-4 h-3" />
              Logout
            </button>
          </div>

        </div>
      </aside>

      {/* Main content */}
      <div className=" flex flex-col min-h-screen w-full">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <div className="lg:hidden flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <div className="font-bold text-slate-800">Auto Garage</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-200">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                Demo Environment
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 pt-8 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}