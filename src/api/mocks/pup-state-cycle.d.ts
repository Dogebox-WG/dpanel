// Type bridge for pup-state-cycle.js until the api modules migrate to
// TypeScript in Phase 4.
export interface MockCycle {
  [key: string]: unknown;
}

export function performMockCycle(
  cycle: MockCycle,
  callback: (statusUpdate: unknown) => void,
): Promise<void>;

export const c1: MockCycle;
export const c2: MockCycle;
export const c3: MockCycle;
export const c4: MockCycle;
export const c5: MockCycle;
export const mockInstallEvent: unknown;
