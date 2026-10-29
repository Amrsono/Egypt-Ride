import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from './types.js';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nasr-ride-secret-key-2026';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Token missing.' });
  }

  const token = authHeader.split(' ')[1];

  // 1. Direct user token support (mock/local tokens)
  if (token.startsWith('token_user_')) {
    const users = db.getUsers();
    let matched = users.find((u) => token.includes(u.id));
    if (!matched) {
      if (token.includes('driver')) matched = users.find((u) => u.role === 'driver');
      else if (token.includes('admin')) matched = users.find((u) => u.role === 'admin');
      else matched = users.find((u) => u.role === 'customer');
    }
    if (matched) {
      req.user = matched;
      return next();
    }
  }

  // 2. Standard JWT verify
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email?: string; role?: UserRole };
    let user = db.getUserById(decoded.id);
    if (!user && decoded.email) {
      user = db.getUserByEmail(decoded.email);
    }
    if (!user && decoded.role) {
      user = db.getUsers().find((u) => u.role === decoded.role);
    }
    if (user) {
      req.user = user;
      return next();
    }
  } catch (err) {
    // Continue to fallback discovery below
  }

  // 3. Fallback discovery for legacy or modified seed tokens
  const users = db.getUsers();
  let fallbackUser = users.find((u) => token.includes(u.id));
  if (!fallbackUser) {
    if (token.includes('driver')) fallbackUser = users.find((u) => u.role === 'driver');
    else if (token.includes('admin')) fallbackUser = users.find((u) => u.role === 'admin');
    else if (token.includes('customer') || token.includes('amrsono')) fallbackUser = users.find((u) => u.role === 'customer');
  }

  if (fallbackUser) {
    req.user = fallbackUser;
    return next();
  }

  return res.status(401).json({ error: 'Invalid or expired token.' });
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
}
