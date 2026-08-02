import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// The imports above are supplied so students can use jwt and config.jwtSecret.

// COMPLETED(PART 3): Validate the Bearer JWT and set req.user before calling next().
export function authenticateToken(req, res, next) {

  const authorization = req.header("Authorization");
  
  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authorization.slice("Bearer ".length).trim();

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ error: "Authentication required" });
  }
}

// COMPLETED(PART 3): Authorize req.user.role against allowedRoles before calling next().
export function requireRole(...allowedRoles) {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Administrator access required" });
    }

    return next();

  };
}

void jwt;
void config;
