// Type bridge for action.js until the api modules migrate to TypeScript in
// Phase 4.
import type { ActionSubmissionResponse } from "/api/config/config.js";

export function pickAndPerformPupAction(
  pupId: string,
  action: string,
  body?: unknown,
): Promise<ActionSubmissionResponse>;
