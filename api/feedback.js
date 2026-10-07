import { MongoClient } from 'mongodb';

const allowedItems = new Set(['cake-and-pastries', 'biscuits', 'others']);
const allowedExperiences = new Set(['jhakaas', 'ok-ok-tha', 'mujhe-hurt-hua-bigg-boss']);

// Vercel keeps this module warm between requests, so reuse its database connection.
let clientPromise;

function getClient() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MongoDB is not configured. Set MONGODB_URI in the Vercel environment.');
  }
  if (!clientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI);
    clientPromise = client.connect();
  }
  return clientPromise;
}

function isValidEmail(email) {
  return typeof email === 'string'
    && email.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Use POST to submit feedback.' });
  }

  const { cafeId, name, email, 'item-had': itemHad, experience } = request.body || {};
  if (typeof cafeId !== 'string' || !/^[a-z0-9-]{1,64}$/i.test(cafeId)) {
    return response.status(400).json({ error: 'A valid café ID is required.' });
  }
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120) {
    return response.status(400).json({ error: 'Please enter a valid name.' });
  }
  if (!isValidEmail(email)) {
    return response.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!allowedItems.has(itemHad) || !allowedExperiences.has(experience)) {
    return response.status(400).json({ error: 'Please answer both feedback questions.' });
  }

  try {
    const client = await getClient();
    const db = client.db(process.env.MONGODB_DB || 'frutos_secos');
    const cafe = await db.collection('cafes').findOne(
      { cafeId, active: { $ne: false } },
      { projection: { _id: 0, googleReviewUrl: 1 } }
    );

    if (!cafe) {
      return response.status(404).json({ error: 'This café is not configured yet. Please ask the café team for help.' });
    }

    let reviewUrl;
    try {
      reviewUrl = new URL(cafe.googleReviewUrl);
    } catch {
      return response.status(503).json({ error: 'The review link for this café is not configured yet.' });
    }
    if (reviewUrl.protocol !== 'https:') {
      return response.status(503).json({ error: 'The review link for this café is not configured yet.' });
    }

    await db.collection('feedback').insertOne({
      cafeId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      itemHad,
      experience,
      submittedAt: new Date()
    });

    // Every successful respondent gets the same review opportunity for this café.
    return response.status(201).json({ ok: true, reviewUrl: reviewUrl.toString() });
  } catch (error) {
    console.error('Feedback submission failed:', error.message);
    return response.status(500).json({ error: 'We could not save your feedback right now. Please try again later.' });
  }
}
