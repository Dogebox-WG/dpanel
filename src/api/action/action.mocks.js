/**
 * Pup Action Mocks
 * 
 * NOTE: In the new architecture, the backend creates activities for pup actions.
 * These mocks just return success responses. The backend will emit WebSocket events
 * for activity creation and progress updates.
 */

const postResponse = {
  success: true,
  message: "Winner winner, chicken dinner",
  id: 123,
};

export const startMock = {
  name: '/pup/:pup/enable',
  method: 'post',
  group: 'pup actions',
  res: (path, config) => {
    const pupId = path.split('/')[2];
    // Backend will create activity via WebSocket
    return { ...postResponse, message: `Enable ${pupId} initiated` };
  }
};

export const stopMock = {
  name: '/pup/:pup/disable',
  method: 'post',
  group: 'pup actions',
  res: (path, config) => {
    const pupId = path.split('/')[2];
    // Backend will create activity via WebSocket
    return { ...postResponse, message: `Disable ${pupId} initiated` };
  }
};

export const installMock = {
  name: '/pup',
  method: 'put',
  group: 'pup actions',
  res: (path, config) => {
    const body = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
    const pupName = body?.pupName || 'Unknown Pup';
    // Backend will create activity via WebSocket
    return { ...postResponse, message: `Install ${pupName} initiated` };
  }
};

export const uninstallMock = {
  name: '/pup/:pup/uninstall',
  method: 'post',
  group: 'pup actions',
  res: (path, config) => {
    const pupId = path.split('/')[2];
    // Backend will create activity via WebSocket
    return { ...postResponse, message: `Uninstall ${pupId} initiated` };
  }
};

export const purgeMock = {
  name: '/pup/:pup/purge',
  method: 'post',
  group: 'pup actions',
  res: (path, config) => {
    const pupId = path.split('/')[2];
    // Backend will create activity via WebSocket
    return { ...postResponse, message: `Purge ${pupId} initiated` };
  }
};

