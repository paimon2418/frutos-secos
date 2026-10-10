import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'fs_admin_session';
const SESSION_SECONDS = 8 * 60 * 60;

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be set to a random value of at least 32 characters.');
  }
  return secret;
}

function signature(expiresAt) {
  return createHmac('sha256', getSecret()).update(String(expiresAt)).digest('base64url');
}

function secureEqual(left, right) {
  const leftHash = createHash('sha256').update(String(left)).digest();
  const rightHash = createHash('sha256').update(String(right)).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function getCookie(req) {
  const cookieHeader = req.headers.cookie || '';
  for (const part of cookieHeader.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === COOKIE_NAME) return decodeURIComponent(value.join('='));
  }
  return '';
}

export function verifyAdminSession(req) {
  const token = getCookie(req);
  const [expiresAt, suppliedSignature] = token.split('.');
  if (!expiresAt || !suppliedSignature || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;
  try { return secureEqual(signature(expiresAt), suppliedSignature); }
  catch (_) { return false; }
}

export function setAdminSession(res) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const token = `${expiresAt}.${signature(expiresAt)}`;
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=${SESSION_SECONDS}`);
}

export function clearAdminSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=0`);
}

export function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    const originHost = new URL(origin).host;
    const requestHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    return Boolean(requestHost) && originHost === requestHost;
  } catch (_) {
    return false;
  }
}

