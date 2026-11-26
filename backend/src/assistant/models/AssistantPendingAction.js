const mongoose = require('mongoose');

const assistantPendingActionSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssistantSession', required: true, index: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    toolName: { type: String, required: true, maxlength: 80 },
    summary: { type: String, required: true, maxlength: 2000 },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'expired'], default: 'pending', index: true },
    // Always set a unique value on write — legacy nulls collided on the unique index
    idempotencyKey: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

assistantPendingActionSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
assistantPendingActionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.AssistantPendingAction
  || mongoose.model('AssistantPendingAction', assistantPendingActionSchema);
