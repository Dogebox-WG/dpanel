import { store } from '../../state/store.js';

export const getAllJobsMock = {
  name: '/jobs',
  method: 'get',
  group: 'jobs',
  res: () => {
    // Return jobs from store
    const { jobs } = store.jobsContext;
    return { success: true, jobs };
  }
};

export const createJobMock = {
  name: '/jobs',
  method: 'post',
  group: 'jobs',
  res: (path, config) => {
    const body = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
    
    // Create new job and add to store
    const newJob = {
      id: ++store.jobsContext.lastJobId,
      started: new Date().toISOString(),
      finished: null,
      displayName: body.displayName || 'Unnamed Job',
      sensitive: body.sensitive || false,
      progress: 0,
      status: 'queued',
      summaryMessage: body.summaryMessage || 'Queued',
      errorMessage: null,
      logs: [],
      read: false
    };
    
    store.updateState({
      jobsContext: {
        jobs: [...store.jobsContext.jobs, newJob]
      }
    });
    
    return { success: true, job: newJob };
  }
};

export const updateJobMock = {
  name: '/jobs/:id',
  method: 'patch',
  group: 'jobs',
  res: (path, config) => {
    const body = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
    const jobId = parseInt(path.split('/').pop());
    
    const jobs = store.jobsContext.jobs.map(job => {
      if (job.id === jobId) {
        return { ...job, ...body };
      }
      return job;
    });
    
    store.updateState({
      jobsContext: { jobs }
    });
    
    return { success: true };
  }
};

