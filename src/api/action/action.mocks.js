import { store } from '../../state/store.js';
import { jobSimulator } from '../../utils/job-simulator.js';

// Helper to create a job for a pup action
function createJobForAction(actionName, pupName, isCritical = false) {
  // Generate a unique job ID
  const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const job = {
    id: jobId,
    started: new Date().toISOString(),
    finished: null,
    displayName: `${actionName} ${pupName}`,
    sensitive: isCritical,
    progress: 0,
    status: 'queued',
    summaryMessage: 'Job queued',
    errorMessage: null,
    logs: [`[${new Date().toLocaleTimeString()}] Job created`],
    read: false,
    pupID: pupName
  };
  
  // Add to store
  store.updateState({
    jobsContext: {
      jobs: [...store.jobsContext.jobs, job]
    }
  });
  
  // Start job simulation
  setTimeout(() => {
    // Update to in_progress
    const jobs = store.jobsContext.jobs.map(j => 
      j.id === jobId ? { ...j, status: 'in_progress', summaryMessage: 'Starting...' } : j
    );
    store.updateState({ jobsContext: { jobs } });
    
    // Start progress simulation
    jobSimulator.startSimulation(jobId, {
      logMessages: [
        'Fetching dependencies...',
        'Building packages...',
        'Configuring system...',
        'Running nix rebuild...',
        'Finalizing installation...',
        'Verifying configuration...',
      ]
    });
  }, 2000);
  
  return jobId;
}

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
    const jobId = createJobForAction('Enable', pupId, true);
    return { ...postResponse, id: jobId };
  }
};

export const stopMock = {
  name: '/pup/:pup/disable',
  method: 'post',
  group: 'pup actions',
  res: (path, config) => {
    const pupId = path.split('/')[2];
    const jobId = createJobForAction('Disable', pupId, true);
    return { ...postResponse, id: jobId };
  }
};

export const installMock = {
  name: '/pup',
  method: 'put',
  group: 'pup actions',
  res: (path, config) => {
    const body = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
    const pupName = body?.pupName || 'Unknown Pup';
    const jobId = createJobForAction('Install', pupName, true);
    return { ...postResponse, id: jobId };
  }
};

export const uninstallMock = {
  name: '/pup/:pup/uninstall',
  method: 'post',
  group: 'pup actions',
  res: (path, config) => {
    const pupId = path.split('/')[2];
    const jobId = createJobForAction('Uninstall', pupId, true);
    return { ...postResponse, id: jobId };
  }
};

export const purgeMock = {
  name: '/pup/:pup/purge',
  method: 'post',
  group: 'pup actions',
  res: (path, config) => {
    const pupId = path.split('/')[2];
    const jobId = createJobForAction('Purge', pupId, true);
    return { ...postResponse, id: jobId };
  }
};

