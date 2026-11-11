import { MongoClient } from 'mongodb';

const DEFAULT_QUESTIONS = [
  { id: 'itemHad', prompt: 'What did you have today?', options: ['Cake and pastries', 'Biscuits', 'Others'] },
  { id: 'experience', prompt: 'How was your experience?', options: ['Jhakaas', 'Ok ok tha', 'Mujhe hurt hua, Bigg Boss'] },
  { id: 'recommend', prompt: 'Would you recommend us?', options: ['Definitely', 'Maybe', 'No'] }
];

let clientPromise;

function getClient() {
  if (!process.env.MONGODB_URI) throw new Error('MongoDB is not configured.');
  if (!clientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    clientPromise = client.connect().catch((error) => {
      clientPromise = undefined;
      throw error;
    });
  }
  return clientPromise;
}

function validCafeId(value) {
  return typeof value === 'string' && /^[a-z0-9-]{1,64}$/i.test(value);
}

function questionsFor(cafe) {
  const configured = Array.isArray(cafe.feedbackQuestions) ? cafe.feedbackQuestions : [];
  if (configured.length !== 3 || configured.some((question) =>
    typeof question.prompt !== 'string' || !question.prompt ||
    !Array.isArray(question.options) || question.options.length < 2
  )) return DEFAULT_QUESTIONS;

  return configured.map((question, index) => ({
    id: `q${index + 1}`,
    prompt: question.prompt,
    options: question.options.filter((option) => typeof option === 'string').slice(0, 5)
  }));
}

function isGoogleReviewUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' &&
      (host === 'google.com' || host.endsWith('.google.com') || host === 'maps.app.goo.gl');
  } catch (_) {
    return false;
  }
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  const dbName = process.env.MONGODB_DB || 'frutos_secos';

  if (request.method === 'GET') {
    const cafeId = request.query?.cafeId;
    if (!validCafeId(cafeId)) return response.status(400).json({ error: 'A valid café ID is required.' });

    try {
      const client = await getClient();
      const cafe = await client.db(dbName).collection('cafes').findOne(
        { cafeId, active: { $ne: false } },
        { projection: { _id: 0, cafeName: 1, feedbackQuestions: 1 } }
      );
      if (!cafe) return response.status(404).json({ error: 'This café is not configured yet.' });
      return response.status(200).json({ cafeName: cafe.cafeName || '', questions: questionsFor(cafe) });
    } catch (error) {
      console.error('Could not load café feedback questions:', error.message);
      return response.status(500).json({ error: 'Could not load this café’s feedback form. Please try again.' });
    }
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ error: 'Use GET to load or POST to submit feedback.' });
  }

  const { cafeId, name, contact, whatHad, answers } = request.body || {};
  if (!validCafeId(cafeId)) return response.status(400).json({ error: 'A valid café ID is required.' });
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanContact = typeof contact === 'string' ? contact.trim() : '';
  const cleanWhatHad = typeof whatHad === 'string' ? whatHad.trim() : '';
  const isEmail = cleanContact.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanContact);
  const isPhone = /^\+?[0-9\s()-]{8,20}$/.test(cleanContact);
  if (!cleanName || cleanName.length > 120) return response.status(400).json({ error: 'Please enter your name.' });
  if (!isEmail && !isPhone) return response.status(400).json({ error: 'Enter a valid phone number or email address.' });
  if (!cleanWhatHad || cleanWhatHad.length > 120) return response.status(400).json({ error: 'Please tell us what you had.' });
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return response.status(400).json({ error: 'Please answer all feedback questions.' });
  }

  try {
    const client = await getClient();
    const db = client.db(dbName);
    const cafe = await db.collection('cafes').findOne(
      { cafeId, active: { $ne: false } },
      { projection: { _id: 0, cafeName: 1, googleReviewUrl: 1, feedbackQuestions: 1 } }
    );
    if (!cafe) return response.status(404).json({ error: 'This café is not configured yet.' });

    const questions = questionsFor(cafe);
    const cleanAnswers = {};
    for (const [index, question] of questions.entries()) {
      const answer = answers[question.id];
      if (typeof answer !== 'string' || !question.options.includes(answer)) {
        return response.status(400).json({ error: `Please choose an answer for Question ${index + 1}.` });
      }
      cleanAnswers[question.id] = answer;
    }

    if (!isGoogleReviewUrl(cafe.googleReviewUrl)) {
      return response.status(503).json({ error: 'The Google Review link for this café is not configured yet.' });
    }

    await db.collection('feedback').insertOne({
      cafeId,
      cafeName: cafe.cafeName || null,
      name: cleanName,
      contact: isEmail ? cleanContact.toLowerCase() : cleanContact,
      contactType: isEmail ? 'email' : 'phone',
      whatHad: cleanWhatHad,
      answers: cleanAnswers,
      submittedAt: new Date()
    });

    return response.status(201).json({ ok: true, reviewUrl: cafe.googleReviewUrl });
  } catch (error) {
    console.error('Feedback submission failed:', error.message);
    return response.status(500).json({ error: 'We could not save your feedback right now. Please try again later.' });
  }
}

