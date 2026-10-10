import { randomBytes } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { isSameOrigin, verifyAdminSession } from '../lib/admin-auth.js';

let clientPromise;

function sendError(res, status, error) {
  return res.status(status).json({ error });
}

function text(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function validUrl(value, allowedHosts) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (!allowedHosts || allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`)));
  } catch (_) {
    return false;
  }
}

async function getClient() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured.');
  if (!clientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    clientPromise = client.connect().catch((error) => {
      clientPromise = undefined;
      throw error;
    });
  }
  return clientPromise;
}

function getBaseUrl(req) {
  if (process.env.PUBLIC_SITE_URL) return process.env.PUBLIC_SITE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  return `https://${host}`;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'Method not allowed');
  }
  if (!isSameOrigin(req)) return sendError(res, 403, 'Request origin was not accepted.');
  if (!verifyAdminSession(req)) return sendError(res, 401, 'Unauthorized. Please sign in again.');

  const body = req.body || {};
  const cafeName = text(body.cafeName, 100);
  const address = text(body.address, 500);
  const ownerName = text(body.ownerName, 100);
  const phone = text(body.phone, 20);
  const gstNumber = text(body.gstNumber, 15).toUpperCase();
  const speciality = text(body.speciality, 200);
  const photoUrl = text(body.photoUrl, 1000);
  const googleReviewUrl = text(body.googleReviewUrl, 2000);

  if (!cafeName || !address || !ownerName || !phone || !speciality || !googleReviewUrl) {
    return sendError(res, 400, 'Fill in all required café details. GST number and photo URL are optional.');
  }
  if (!/^\+?[0-9\s()-]{8,20}$/.test(phone)) return sendError(res, 400, 'Enter a valid phone number.');
  if (gstNumber && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstNumber)) {
    return sendError(res, 400, 'GSTIN format does not look valid. Leave it empty if the café is not GST registered.');
  }
  if (photoUrl && !validUrl(photoUrl)) return sendError(res, 400, 'Photo URL must be an HTTPS link.');
  if (!validUrl(googleReviewUrl, ['google.com', 'maps.app.goo.gl'])) return sendError(res, 400, 'Google review link must be an HTTPS Google Maps link.');

  try {
    const client = await getClient();
    const db = client.db(process.env.MONGODB_DB || 'frutos_secos');
    const cafes = db.collection('cafes');
    let cafeId;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      cafeId = `CAF-${randomBytes(4).toString('hex').toUpperCase()}`;
      if (!(await cafes.findOne({ cafeId }, { projection: { _id: 1 } }))) break;
      cafeId = undefined;
    }
    if (!cafeId) return sendError(res, 503, 'Could not create a unique café ID. Please try again.');

    const cafe = {
      cafeId,
      cafeName,
      address,
      ownerName,
      phone,
      gstNumber: gstNumber || null,
      speciality,
      photoUrl: photoUrl || null,
      active: true,
      googleReviewUrl,
      createdAt: new Date()
    };
    await cafes.insertOne(cafe);

    const feedbackUrl = `${getBaseUrl(req)}/feedback.html?cafe=${encodeURIComponent(cafeId)}`;
    return res.status(201).json({ cafe, feedbackUrl });
  } catch (error) {
    console.error('Café registration failed:', error);
    if (error.code === 13 || error.codeName === 'Unauthorized') {
      return sendError(res, 500, 'Database permission missing. Add INSERT on frutos_secos.cafes to the app role.');
    }
    return sendError(res, 500, 'Could not save the café. Check the database connection and try again.');
  }
}
