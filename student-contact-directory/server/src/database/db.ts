import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

fs.mkdirSync(path.dirname(env.dbPath), { recursive: true });
export const db = new Database(env.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin','viewer')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      roll_number TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      mobile_number TEXT NOT NULL,
      department TEXT NOT NULL,
      course TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      semester INTEGER,
      section TEXT,
      batch TEXT,
      status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_students_name ON students(full_name);
    CREATE INDEX IF NOT EXISTS idx_students_dept ON students(department);
    CREATE INDEX IF NOT EXISTS idx_students_year ON students(academic_year);
    CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
    CREATE INDEX IF NOT EXISTS idx_students_created ON students(created_at);
  `);
  ensureUser(env.adminName, env.adminEmail, env.adminPassword, 'admin');
  if (env.viewerEmail && env.viewerPassword) ensureUser('Viewer', env.viewerEmail, env.viewerPassword, 'viewer');
}

function ensureUser(name: string, email: string, password: string, role: 'admin' | 'viewer') {
  if (!email || !password) {
    if (role === 'admin') console.warn('[init] ADMIN_EMAIL / ADMIN_PASSWORD not set - no admin account created.');
    return;
  }
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return; // never overwrite existing accounts
  db.prepare('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)')
    .run(name, email, bcrypt.hashSync(password, 12), role);
  console.log(`[init] Created ${role} account: ${email}`);
}
