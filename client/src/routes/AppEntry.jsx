// client/src/routes/AppEntry.jsx
// Used for "/" inside the Android / iOS app instead of the marketing landing page.
// Logged in → straight to the right dashboard. Otherwise → login.
import { Navigate } from "react-router-dom";
import { hasUsableToken, getDashboardPath } from "../utils/authStorage";

export default function AppEntry() {
  return hasUsableToken() ? (
    <Navigate to={getDashboardPath()} replace />
  ) : (
    <Navigate to="/login" replace />
  );
}
