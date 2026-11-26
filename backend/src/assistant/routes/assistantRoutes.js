const express = require('express');
const mongoose = require('mongoose');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { httpError } = require('../../utils/httpError');
const {
  ask,
  getSessionHandler,
  deleteSessionHandler,
  submitFeedback,
  listFeedback,
  reviewFeedback,
} = require('../controllers/assistantController');

const router = express.Router();

function requireDatabase(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return next(httpError(503, 'The database is not available.'));
  }
  return next();
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

router.use(requireAuth, requireRole('admin'), requireDatabase);

router.post('/ask', asyncHandler(ask));
router.get('/sessions/:sessionId', asyncHandler(getSessionHandler));
router.delete('/sessions/:sessionId', asyncHandler(deleteSessionHandler));
router.post('/feedback', asyncHandler(submitFeedback));
router.get('/feedback', asyncHandler(listFeedback));
router.patch('/feedback/:id', asyncHandler(reviewFeedback));

module.exports = router;
