export type AssistantDocumentType = 'salary_slip' | 'payroll' | 'wage_register' | 'attendance_register' | 'bank_invoice' | 'payroll_run' | 'client_invoice';
export type AssistantFormat = 'pdf' | 'excel';

export type AssistantDocument = {
  type: AssistantDocumentType;
  format: AssistantFormat;
  month: string;
  organizationId: string | null;
  locationId: string | null;
  employeeIds: string[] | null;
  batchId?: string | null;
  reprint?: boolean;
  title: string;
};

export type AssistantPlan = {
  type: AssistantDocumentType | 'mark_attendance' | 'edit_attendance' | 'salary_amount' | 'employee_attendance' | 'cancel' | string;
  format?: AssistantFormat;
  month?: string;
  organizationId?: string | null;
  locationId?: string | null;
  locationIds?: string[];
  batchId?: string | null;
  employeeId?: string | null;
  status?: string | null;
  restStatus?: string | null;
  dates?: string[];
  count?: number | null;
  confirm?: boolean;
  latest?: boolean;
  full?: boolean;
  pendingActionId?: string;
};

export type AssistantChoice = { label: string; plan: AssistantPlan };

export type AssistantExecution = {
  status?: string;
  verified?: boolean;
};

export type AssistantPendingAction = {
  id: string;
  toolName?: string;
  summary?: string;
  expiresAt?: string;
  status?: string;
};

export type AssistantResponse = {
  success?: boolean;
  reply: string;
  source: 'ai' | 'rules' | 'plan' | 'data' | 'tool' | 'validation' | 'pending_action';
  document?: AssistantDocument;
  choices?: AssistantChoice[];
  sessionId: string;
  intent?: string;
  pendingAction?: AssistantPendingAction | null;
  execution?: AssistantExecution;
  data?: unknown;
  error?: { code?: string; message?: string; retryable?: boolean };
};

export type AssistantSessionMessage = { role: 'user' | 'assistant'; content: string; document?: AssistantDocument };

export type AssistantFeedbackType =
  | 'correct_answer'
  | 'incorrect_answer'
  | 'wrong_intent'
  | 'missing_details'
  | 'wrong_calculation'
  | 'failed_action'
  | 'irrelevant_response'
  | 'language_issue';

export type AssistantFeedbackSummary = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  repeatedErrors: Array<{ type: string; count: number }>;
};

const DISABLED_REPLY = 'Assistant backend API हटा दी गई है। UI अभी उपलब्ध है, लेकिन chat/feedback server पर नहीं जाते।';

function emptySessionId(sessionId?: string | null) {
  return sessionId || `local-${Date.now()}`;
}

/** Assistant APIs removed from backend — stubs keep the UI running without network calls. */
export async function askAssistant(
  input: {
    message?: string;
    plan?: AssistantPlan;
    label?: string;
    sessionId?: string | null;
    language?: string;
    confirmPendingActionId?: string;
    cancel?: boolean;
  },
  _signal?: AbortSignal,
): Promise<AssistantResponse> {
  return {
    success: false,
    reply: DISABLED_REPLY,
    source: 'validation',
    sessionId: emptySessionId(input.sessionId),
    error: { code: 'assistant_removed', message: DISABLED_REPLY, retryable: false },
  };
}

export async function getAssistantSession(sessionId: string) {
  return { sessionId, messages: [] as AssistantSessionMessage[] };
}

export async function deleteAssistantSession(_sessionId: string) {
  return undefined;
}

export async function submitAssistantFeedback(_input: {
  type: AssistantFeedbackType;
  sessionId?: string | null;
  originalRequest?: string;
  assistantResponse?: string;
  detectedIntent?: string;
  toolName?: string;
  correction?: string;
  expectedBehaviour?: string;
}) {
  return {
    success: false,
    feedback: { id: '', type: '', status: 'rejected' },
  };
}

export async function listAssistantFeedback(_status?: string) {
  return {
    success: true,
    summary: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      repeatedErrors: [],
    } satisfies AssistantFeedbackSummary,
    items: [] as Array<{
      id: string;
      type: string;
      status: string;
      originalRequest: string;
      assistantResponse: string;
      correction: string;
      expectedBehaviour: string;
      createdAt: string;
    }>,
  };
}

export async function reviewAssistantFeedback(
  _id: string,
  _body: { status: 'approved' | 'rejected'; reviewNote?: string },
) {
  return { success: false };
}
