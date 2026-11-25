import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { db } from '../database/db';
import { requireAuth } from '../middleware/auth';

const router = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});
const cookieOpts = { httpOnly: true, secure: env.isProd, sameSite: 'lax' as const, path: '/' };

router.post('/login', loginLimiter, (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!row || !bcrypt.compareSync(password, row.password_hash))
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  const token = jwt.sign({ id: row.id }, env.jwtSecret, { expiresIn: '7d' });
  res.cookie('token', token, { ...cookieOpts, maxAge: 7 * 24 * 3600 * 1000 });
  res.json({ success: true, data: { id: row.id, name: row.name, email: row.email, role: row.role } });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token', cookieOpts);
  res.json({ success: true, message: 'Logged out' });
});

router.get('/me', requireAuth, (req, res) => res.json({ success: true, data: req.user }));

export default router;
