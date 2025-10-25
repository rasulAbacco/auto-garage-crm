import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {jwtDecode} from "jwt-decode";
const API_URL = import.meta.env.VITE_API_BASE_URL;
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const [isValid, setIsValid] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setIsValid(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp && decoded.exp < currentTime) {
        // Token expired
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsValid(false);
      } else {
        // Token looks fine (now verify server-side)
        verifyToken();
      }
    } catch (err) {
      setIsValid(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setIsValid(true);
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsValid(false);
      }
    } catch (err) {
      setIsValid(false);
    }
  };

  if (isValid === null) return <div className="text-center p-10">Verifying...</div>;
  if (!isValid) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
