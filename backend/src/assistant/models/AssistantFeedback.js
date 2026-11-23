const mongoose = require('mongoose');

const FEEDBACK_TYPES = [
  'correct_answer',
  'incorrect_answer',
  'wrong_intent',
  'missing_details',
  'wrong_calculation',
  'failed_action',
  'irrelevant_response',
  'language_issue',
];

const assistantFeedbackSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssistantSession', default: null },
    type: { type: String, enum: FEEDBACK_TYPES, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    originalRequest: { type: String, default: '', maxlength: 4000 },
    assistantResponse: { type: String, default: '', maxlength: 8000 },
    detectedIntent: { type: String, default: '', maxlength: 120 },
    toolName: { type: String, default: '', maxlength: 80 },
    correction: { type: String, default: '', maxlength: 4000 },
    expectedBehaviour: { type: String, default: '', maxlength: 4000 },
    reviewNote: { type: String, default: '', maxlength: 2000 },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = {
  FEEDBACK_TYPES,
  AssistantFeedback: mongoose.models.AssistantFeedback
    || mongoose.model('AssistantFeedback', assistantFeedbackSchema),
};
