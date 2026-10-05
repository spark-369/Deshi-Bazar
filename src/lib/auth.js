import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

// Refuse to boot in production with the hardcoded dev secret: a known secret
// would let anyone forge tokens. Failing fast here (at cold start) is far
// safer than silently signing weak JWTs on every request.
if (
  process.env.NODE_ENV === "production" &&
  !process.env.JWT_SECRET
) {
  throw new Error(
    "JWT_SECRET environment variable is not set. Set it in your Vercel project settings before deploying.",
  );
}

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const TWO_FACTOR_TEMP_EXPIRES_IN = "5m";

// Convert secret to Uint8Array for jose
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object with id, email, and role
 * @returns {string} JWT token
 */
export async function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(getSecretKey());

  return token;
}

/**
 * Generate a temporary token for 2FA verification
 * @param {Object} user - User object with id, email, and role
 * @returns {string} Temporary JWT token
 */
export async function generate2FATempToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    pending2FA: true,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TWO_FACTOR_TEMP_EXPIRES_IN)
    .sign(getSecretKey());

  return token;
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
}

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a password with its hash
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null if not found
 */
export function extractToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split(" ")[1];
}

/**
 * Authentication middleware helper
 * @param {string} token - JWT token
 * @returns {Object|null} User data from token or null if invalid
 */
export async function authenticateToken(token) {
  const decoded = await verifyToken(token);
  if (!decoded) {
    return null;
  }
  return decoded;
}

/**
 * Generate a 6-digit 2FA code
 * @returns {string} 6-digit code
 */
export function generate2FACode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a short-lived password reset token
 * @param {Object} user - User object with id, email, and role
 * @returns {string} Password reset JWT token (expires in 1 hour)
 */
export async function generateResetToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    purpose: "password-reset",
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getSecretKey());

  return token;
}
