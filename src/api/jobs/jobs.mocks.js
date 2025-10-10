import { store } from '../../state/store.js';
import { jobSimulator } from '../../utils/job-simulator.js';

// POST /jobs - Create a new job (for testing/development)
export const createJobMock = {
  name: '/jobs',
  method: 'post',
  group: 'jobs',
  res: (path, config) => {
    const body = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
    const { displayName = 'Test Job', summaryMessage = 'Job created', sensitive = false } = body;
    
    // Generate a unique job ID
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const job = {
      id: jobId,
      started: new Date().toISOString(),
      finished: null,
      displayName,
      sensitive,
      progress: 0,
      status: 'queued',
      summaryMessage,
      errorMessage: null,
      logs: [`[${new Date().toLocaleTimeString()}] Job created`],
      read: false
    };
    
    // Add to store - the job monitor will handle starting it based on critical job logic
    store.updateState({
      jobsContext: {
        jobs: [...store.jobsContext.jobs, job]
      }
    });
    
    // DON'T start the simulation here - let the job monitor handle it
    // This ensures critical job logic is respected and multiple critical jobs don't run at once
    
    return { success: true, job };
  }
};

// GET /jobs - Get all jobs
export const getAllJobsMock = {
  name: '/jobs',
  method: 'get',
  group: 'jobs',
  res: () => {
    const { jobs } = store.jobsContext;
    return { success: true, jobs };
  }
};

// GET /jobs/{jobID} - Get single job
export const getJobMock = {
  name: '/jobs/:jobID',
  method: 'get',
  group: 'jobs',
  res: (path) => {
    const jobId = path.split('/').pop();
    const job = store.jobsContext.jobs.find(j => j.id === jobId);
    
    if (!job) {
      return { success: false, error: 'Job not found' };
    }
    
    return { success: true, job };
  }
};

// GET /jobs/active - Get active jobs
export const getActiveJobsMock = {
  name: '/jobs/active',
  method: 'get',
  group: 'jobs',
  res: () => {
    const { jobs } = store.jobsContext;
    const activeJobs = jobs.filter(j => j.status === 'queued' || j.status === 'in_progress');
    return { success: true, jobs: activeJobs };
  }
};

// GET /jobs/recent - Get recent jobs
export const getRecentJobsMock = {
  name: '/jobs/recent',
  method: 'get',
  group: 'jobs',
  res: () => {
    const { jobs } = store.jobsContext;
    const recentJobs = jobs
      .filter(j => j.status === 'completed' || j.status === 'failed' || j.status === 'cancelled')
      .sort((a, b) => new Date(b.finished || b.started) - new Date(a.finished || a.started))
      .slice(0, 50);
    return { success: true, jobs: recentJobs };
  }
};

// GET /jobs/stats - Get job statistics
export const getJobStatsMock = {
  name: '/jobs/stats',
  method: 'get',
  group: 'jobs',
  res: () => {
    const { jobs } = store.jobsContext;
    
    const stats = {
      total: jobs.length,
      queued: jobs.filter(j => j.status === 'queued').length,
      inProgress: jobs.filter(j => j.status === 'in_progress').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      cancelled: jobs.filter(j => j.status === 'cancelled').length,
      unread: jobs.filter(j => !j.read && ['completed', 'failed', 'cancelled'].includes(j.status)).length
    };
    
    return { success: true, stats };
  }
};

// GET /jobs/critical-status - Check for critical job running
export const getCriticalJobStatusMock = {
  name: '/jobs/critical-status',
  method: 'get',
  group: 'jobs',
  res: () => {
    const { jobs } = store.jobsContext;
    const criticalJob = jobs.find(j => j.sensitive && j.status === 'in_progress');
    
    return {
      success: true,
      hasCritical: !!criticalJob,
      criticalJob: criticalJob || null
    };
  }
};

// POST /jobs/{jobID}/cancel - Cancel a job
export const cancelJobMock = {
  name: '/jobs/:jobID/cancel',
  method: 'post',
  group: 'jobs',
  res: (path) => {
    const jobId = path.split('/')[2];
    
    // Stop simulation if running
    jobSimulator.stopSimulation(jobId);
    
    const jobs = store.jobsContext.jobs.map(job => {
      if (job.id === jobId) {
        const now = new Date().toISOString();
        return {
          ...job,
          status: 'cancelled',
          finished: now,
          summaryMessage: 'Job cancelled by user',
          read: false
        };
      }
      return job;
    });
    
    store.updateState({
      jobsContext: { jobs }
    });
    
    return { success: true, message: 'Job cancelled' };
  }
};

// POST /jobs/{jobID}/read - Mark job as read
export const markJobAsReadMock = {
  name: '/jobs/:jobID/read',
  method: 'post',
  group: 'jobs',
  res: (path) => {
    const jobId = path.split('/')[2];
    
    const jobs = store.jobsContext.jobs.map(job => {
      if (job.id === jobId) {
        return { ...job, read: true };
      }
      return job;
    });
    
    store.updateState({
      jobsContext: { jobs }
    });
    
    return { success: true };
  }
};

// POST /jobs/read-all - Mark all jobs as read
export const markAllJobsAsReadMock = {
  name: '/jobs/read-all',
  method: 'post',
  group: 'jobs',
  res: () => {
    const { jobs } = store.jobsContext;
    
    const updatedJobs = jobs.map(job => {
      if (!job.read && ['completed', 'failed', 'cancelled'].includes(job.status)) {
        return { ...job, read: true };
      }
      return job;
    });
    
    store.updateState({
      jobsContext: { jobs: updatedJobs }
    });
    
    return { success: true };
  }
};

// POST /jobs/clear-completed - Clear old completed jobs
export const clearCompletedJobsMock = {
  name: '/jobs/clear-completed',
  method: 'post',
  group: 'jobs',
  res: (path, config) => {
    const body = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
    const olderThanDays = body?.olderThanDays || 30;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const { jobs } = store.jobsContext;
    const remainingJobs = jobs.filter(job => {
      // Keep active jobs
      if (job.status === 'queued' || job.status === 'in_progress') {
        return true;
      }
      
      // Keep recent completed jobs
      const jobDate = new Date(job.finished || job.started);
      return jobDate > cutoffDate;
    });
    
    const cleared = jobs.length - remainingJobs.length;
    
    store.updateState({
      jobsContext: { jobs: remainingJobs }
    });
    
    return { success: true, cleared };
  }
};
