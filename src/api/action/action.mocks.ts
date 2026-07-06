/**
 * Pup Action Mocks
 * 
 * These mocks just return success responses. The backend will emit WebSocket events
 * for activity creation and progress updates.
 */

import type { MockDescriptor, MockResOptions } from "../client.js";

const postResponse = {
  success: true,
  message: "Winner winner, chicken dinner",
  id: 123,
};

export const startMock: MockDescriptor = {
  name: '/pup/:pup/enable',
  method: 'post',
  group: 'pup actions',
  res: (path: string, config: MockResOptions) => {
    const pupId = path.split('/')[2];
    // Backend will create activity via WebSocket
    return { ...postResponse, message: `Enable ${pupId} initiated` };
  }
};

export const stopMock: MockDescriptor = {
  name: '/pup/:pup/disable',
  method: 'post',
  group: 'pup actions',
  res: (path: string, config: MockResOptions) => {
    const pupId = path.split('/')[2];
    // Backend will create activity via WebSocket
    return { ...postResponse, message: `Disable ${pupId} initiated` };
  }
};

export const installMock: MockDescriptor = {
  name: '/pup',
  method: 'put',
  group: 'pup actions',
  res: (path: string, config: MockResOptions) => {
    const body = (typeof config.body === 'string' ? JSON.parse(config.body) : config.body) as { pupName?: string } | undefined;
    const pupName = body?.pupName || 'Unknown Pup';
    // Backend will create activity via WebSocket
    return { ...postResponse, message: `Install ${pupName} initiated` };
  }
};

export const uninstallMock: MockDescriptor = {
  name: '/pup/:pup/uninstall',
  method: 'post',
  group: 'pup actions',
  res: (path: string, config: MockResOptions) => {
    const pupId = path.split('/')[2];
    // Backend will create activity via WebSocket
    return { ...postResponse, message: `Uninstall ${pupId} initiated` };
  }
};

export const purgeMock: MockDescriptor = {
  name: '/pup/:pup/purge',
  method: 'post',
  group: 'pup actions',
  res: (path: string, config: MockResOptions) => {
    const pupId = path.split('/')[2];
    // Backend will create activity via WebSocket
    return { ...postResponse, message: `Purge ${pupId} initiated` };
  }
};

