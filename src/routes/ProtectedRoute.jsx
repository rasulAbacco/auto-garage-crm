import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

const isAuthed = () => {
  const auth = localStorage.getItem('auth')
  if (!auth) return false
  try {
    const parsed = JSON.parse(auth)
    return parsed?.isAuthenticated === true
  } catch {
    return false
  }
}

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  if (!isAuthed()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}