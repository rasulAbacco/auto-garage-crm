// client/src/pages/Login/Login.jsx
import { Navigate } from "react-router-dom";
import LoginWeb from "./LoginWeb";
import LoginAndroid from "./LoginAndroid";
import {
  isNativeApp,
  hasUsableToken,
  getDashboardPath,
} from "../../utils/authStorage";

export default function Login() {
  // Already signed in → never show the login screen again
  if (hasUsableToken()) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  // Android AND iOS both use the mobile login screen
  return isNativeApp() ? <LoginAndroid /> : <LoginWeb />;
}
