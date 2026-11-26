const mongoose = require('mongoose');
const { askAssistant, getSession, deleteSession } = require('../engine/askOrchestrator');
const { AssistantFeedback, FEEDBACK_TYPES } = require('../models/AssistantFeedback');
const { httpError } = require('../../utils/httpError');
const { INTENTS } = require('../knowledge/synonyms');
const { applySttFixes } = require('../knowledge/sttFixes');

async function ask(req, res) {
  const body = req.body || {};
  const result = await askAssistant(req.user, {
    message: typeof body.message === 'string' ? body.message.slice(0, 500) : undefined,
    plan: body.plan && typeof body.plan === 'object' ? body.plan : undefined,
    label: typeof body.label === 'string' ? body.label.slice(0, 500) : undefined,
    sessionId: body.sessionId || null,
    language: body.language || 'hi-IN',
    confirmPendingActionId: body.confirmPendingActionId || undefined,
    cancel: Boolean(body.cancel),
    timeZone: body.timeZone || 'Asia/Kolkata',
  });
  return res.json(result);
}

async function getSessionHandler(req, res) {
  const session = await getSession(req.user.id, req.params.sessionId);
  return res.json(session);
}

async function deleteSessionHandler(req, res) {
  await deleteSession(req.user.id, req.params.sessionId);
  return res.status(204).end();
}

async function submitFeedback(req, res) {
  const body = req.body || {};
  if (!FEEDBACK_TYPES.includes(body.type)) {
    throw httpError(400, 'Invalid feedback type.');
  }
  const feedback = await AssistantFeedback.create({
    adminId: req.user.id,
    sessionId: body.sessionId && mongoose.isValidObjectId(body.sessionId) ? body.sessionId : null,
    type: body.type,
    originalRequest: String(body.originalRequest || '').slice(0, 4000),
    assistantResponse: String(body.assistantResponse || '').slice(0, 8000),
    detectedIntent: String(body.detectedIntent || '').slice(0, 120),
    toolName: String(body.toolName || '').slice(0, 80),
    correction: String(body.correction || '').slice(0, 4000),
    expectedBehaviour: String(body.expectedBehaviour || '').slice(0, 4000),
  });
  return res.status(201).json({
    success: true,
    feedback: {
      id: String(feedback._id),
      type: feedback.type,
      status: feedback.status,
    },
  });
}

async function listFeedback(req, res) {
  const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : null;
  const filter = status ? { status } : {};
  const items = await AssistantFeedback.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  const [total, pending, approved, rejected] = await Promise.all([
    AssistantFeedback.countDocuments({}),
    AssistantFeedback.countDocuments({ status: 'pending' }),
    AssistantFeedback.countDocuments({ status: 'approved' }),
    AssistantFeedback.countDocuments({ status: 'rejected' }),
  ]);

  const typeCounts = {};
  for (const item of items) {
    if (item.status === 'pending' || item.type !== 'correct_answer') {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    }
  }
  const repeatedErrors = Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return res.json({
    success: true,
    summary: { total, pending, approved, rejected, repeatedErrors },
    items: items.map((item) => ({
      id: String(item._id),
      type: item.type,
      status: item.status,
      originalRequest: item.originalRequest || '',
      assistantResponse: item.assistantResponse || '',
      correction: item.correction || '',
      expectedBehaviour: item.expectedBehaviour || '',
      createdAt: item.createdAt,
    })),
  });
}

/**
 * Approved feedback with a correction phrase is added as a soft runtime synonym
 * against the detected intent (in-memory for this process).
 */
const runtimePhrases = new Map();

function getRuntimePhrases(intentId) {
  return runtimePhrases.get(intentId) || [];
}

async function reviewFeedback(req, res) {
  const { status, reviewNote } = req.body || {};
  if (!['approved', 'rejected'].includes(status)) {
    throw httpError(400, 'Status must be approved or rejected.');
  }
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, 'Invalid feedback id.');
  const feedback = await AssistantFeedback.findById(req.params.id);
  if (!feedback) throw httpError(404, 'Feedback not found.');
  feedback.status = status;
  feedback.reviewNote = String(reviewNote || '').slice(0, 2000);
  feedback.reviewedAt = new Date();
  await feedback.save();

  if (status === 'approved' && feedback.correction && feedback.detectedIntent) {
    const intent = INTENTS.find((item) => item.id === feedback.detectedIntent);
    const phrase = applySttFixes(String(feedback.correction).trim().toLowerCase()).slice(0, 120);
    if (intent && phrase) {
      const list = runtimePhrases.get(intent.id) || [];
      if (!list.includes(phrase)) {
        list.push(phrase);
        runtimePhrases.set(intent.id, list);
        intent.phrases.push(phrase);
      }
    }
  }

  return res.json({
    success: true,
    feedback: {
      id: String(feedback._id),
      type: feedback.type,
      status: feedback.status,
    },
  });
}

module.exports = {
  ask,
  getSessionHandler,
  deleteSessionHandler,
  submitFeedback,
  listFeedback,
  reviewFeedback,
  getRuntimePhrases,
};
