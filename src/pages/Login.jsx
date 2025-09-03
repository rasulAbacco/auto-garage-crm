import React, { useState } from 'react'
import { Car } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import './Login.css' // Custom styles here

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const submit = (e) => {
    e.preventDefault()
    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('auth', JSON.stringify({ isAuthenticated: true, user: 'admin' }))
      navigate(from, { replace: true })
    } else {
      setError('Invalid credentials. Use admin / admin')
    }
  }

  return (
    <div className="login-container">
      {/* Animated Background SVGs */}
      <div className="animated-shapes">
        <div className="shape shape1" />
        <div className="shape shape2" />
        <div className="shape shape3" />
      </div>

      {/* Login Card */}
      <form onSubmit={submit} className="login-box">
        <div className="flex items-center gap-2 text-indigo-600 mb-4">
          <Car className="w-6 h-6" />
          <div className="font-bold text-lg">Auto Garage CRM</div>
        </div>

        <div className="space-y-4 flex flex-col gap-4">
          <div className='flex flex-col gap-1'>
            <label className="text-md font-bold mb-2 text-gray-800">Username</label>
            <input
              className="login-input 3t-2"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              required
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label className="text-md font-bold mb-2 text-gray-800">Password</label>
            <input
              type="password"
              className="login-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="admin"
              required
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button className="login-button">Sign In</button>
        </div>
      </form>
    </div>
  )
}
