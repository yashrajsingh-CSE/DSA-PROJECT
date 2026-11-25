import dotenv from 'dotenv';
import path from 'path';

export const rootDir = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(rootDir, '.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || 'dev-only-insecure-secret';

if (nodeEnv === 'production' && (jwtSecret.startsWith('replace_with') || jwtSecret === 'dev-only-insecure-secret' || jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET must be a strong random value (32+ chars) in production.');
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv,
  isProd: nodeEnv === 'production',
  dbPath: path.resolve(rootDir, process.env.DATABASE_PATH || './data/students.db'),
  jwtSecret,
  adminName: process.env.ADMIN_NAME || 'Administrator',
  adminEmail: (process.env.ADMIN_EMAIL || '').toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  viewerEmail: (process.env.VIEWER_EMAIL || '').toLowerCase(),
  viewerPassword: process.env.VIEWER_PASSWORD || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
