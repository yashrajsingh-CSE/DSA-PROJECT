import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { db } from '../database/db';

export interface AuthUser { id: number; name: string; email: string; role: 'admin' | 'viewer'; }
declare module 'express-serve-static-core' { interface Request { user?: AuthUser } }

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { id: number };
    const user = db.prepare('SELECT id,name,email,role FROM users WHERE id = ?').get(payload.id) as AuthUser | undefined;
    if (!user) return res.status(401).json({ success: false, message: 'Account no longer exists' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Administrator access required' });
  next();
}
