import { createHash, timingSafeEqual } from 'node:crypto';
import { clearAdminSession, isSameOrigin, setAdminSession, verifyAdminSession } from '../lib/admin-auth.js';

function sendError(res, status, error) {
  res.status(status).json({ error });
}

function sameSecret(candidate, expected) {
  const candidateHash = createHash('sha256').update(String(candidate)).digest();
  const expectedHash = createHash('sha256').update(String(expected)).digest();
  return timingSafeEqual(candidateHash, expectedHash);
}

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    if (verifyAdminSession(req)) return res.status(200).json({ authenticated: true });
    return sendError(res, 401, 'Unauthorized');
  }

  if (req.method === 'DELETE') {
    clearAdminSession(res);
    return res.status(200).json({ authenticated: false });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return sendError(res, 405, 'Method not allowed');
  }

  if (!isSameOrigin(req)) return sendError(res, 403, 'Request origin was not accepted. Open the admin page from this website.');

  const expected = process.env.ADMIN_PASSWORD;
  const candidate = req.body?.password;
  if (!expected || expected.length < 16) return sendError(res, 500, 'ADMIN_PASSWORD must be configured with at least 16 characters.');
  if (typeof candidate !== 'string' || !sameSecret(candidate, expected)) return sendError(res, 401, 'Password is incorrect.');

  try {
    setAdminSession(res);
  } catch (error) {
    console.error('Admin session setup failed:', error.message);
    return sendError(res, 500, 'Admin session is not configured.');
  }
  return res.status(200).json({ authenticated: true });
}
