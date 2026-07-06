// Type bridge for jobs.mocks.js until the api modules migrate to TypeScript
// in Phase 4.
export interface MockJobWebSocket {
  connected: boolean;
  connect(url?: string): void;
  on(
    event: "open" | "message" | "close",
    handler: (event: { data: string }) => void,
  ): void;
  close(): void;
  simulateJobCreated(displayName?: string): void;
}

export function createMockJobWebSocket(): MockJobWebSocket;
