// Type bridge for timeout.js until the utils modules migrate to TypeScript
// in Phase 4.
export function asyncTimeout(delay: number, fn?: () => void): Promise<void>;
