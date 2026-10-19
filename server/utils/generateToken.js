// server/utils/generateToken.js
import jwt from "jsonwebtoken";

// Web keeps the 7-day session. The Android / iOS app gets a long-lived token
// that is renewed every time the app opens (see verifyToken), so an active
// user effectively never gets logged out — only by tapping Logout.
export const WEB_TOKEN_TTL = process.env.JWT_EXPIRES_IN || "7d";
export const MOBILE_TOKEN_TTL = process.env.JWT_MOBILE_EXPIRES_IN || "365d";

/** True when the request comes from the Capacitor app (sends X-Client: mobile). */
export const isMobileRequest = (req) =>
  String(req?.headers?.["x-client"] || "").toLowerCase() === "mobile";

/**
 * generateToken(payload)                → 7-day web token (old behaviour)
 * generateToken(payload, { mobile })    → long-lived app token
 */
export const generateToken = (payload, { mobile = false } = {}) => {
  // Strip JWT-managed claims so an existing decoded token can be re-signed
  // eslint-disable-next-line no-unused-vars
  const { iat, exp, nbf, ...claims } = payload || {};

  return jwt.sign(claims, process.env.JWT_SECRET, {
    expiresIn: mobile ? MOBILE_TOKEN_TTL : WEB_TOKEN_TTL,
  });
};

export default generateToken;
