// Type bridge for config.js until the api modules migrate to TypeScript in
// Phase 4.

/** Action submissions return the transaction id used to resolve the action. */
export interface ActionSubmissionResponse {
  id?: string;
  error?: unknown;
}

export function postConfig(
  pupId: string,
  body: Record<string, unknown>,
): Promise<ActionSubmissionResponse>;
export function getConfig(pupId: string): Promise<unknown>;
export function getConfigs(pupId?: string): Promise<unknown>;
