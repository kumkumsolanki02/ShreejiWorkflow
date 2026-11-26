const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxlength: 8000 },
    document: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

const slotsSchema = new mongoose.Schema(
  {
    organizationId: { type: String, default: null },
    locationId: { type: String, default: null },
    locationIds: { type: [String], default: undefined },
    locationScope: { type: String, default: null },
    employeeId: { type: String, default: null },
    month: { type: String, default: null },
    date: { type: String, default: null },
    intent: { type: String, default: null },
    fields: { type: [String], default: [] },
    status: { type: String, default: null },
    outputMode: { type: String, default: null },
    format: { type: String, default: null },
    pendingIntent: { type: String, default: null },
    pendingFields: { type: [String], default: [] },
    pendingOutputMode: { type: String, default: null },
  },
  { _id: false },
);

const assistantSessionSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    language: { type: String, default: 'hi-IN', maxlength: 20 },
    messages: { type: [messageSchema], default: [] },
    slots: { type: slotsSchema, default: () => ({}) },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

assistantSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.AssistantSession || mongoose.model('AssistantSession', assistantSessionSchema);
