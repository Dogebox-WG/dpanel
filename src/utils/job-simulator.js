import { store } from '../state/store.js';
import { updateJob } from '../api/jobs/jobs.js';

class JobSimulator {
  constructor() {
    this.activeSimulations = new Map();
  }
  
  startSimulation(jobId, options = {}) {
    // Prevent duplicate simulations
    if (this.activeSimulations.has(jobId)) {
      return;
    }
    
    const {
      minDelay = 1000,
      maxDelay = 4000,
      initialDelay = 2000,  // Wait before starting (queued phase)
      successRate = 0.8,  // 80% success rate
      logMessages = [
        'Initializing...',
        'Processing request...',
        'Configuring system...',
        'Running build...',
        'Verifying changes...',
        'Finalizing...',
      ]
    } = options;
    
    const simulate = async () => {
      const job = store.jobsContext.jobs.find(j => j.id === jobId);
      
      // Stop if job not found
      if (!job) {
        this.stopSimulation(jobId);
        return;
      }
      
      // If job is queued, transition it to in_progress
      if (job.status === 'queued') {
        await updateJob(jobId, {
          status: 'in_progress',
          summaryMessage: 'Starting...',
          logs: [`[${new Date().toISOString().split('T')[1].split('.')[0]}] Job started`]
        });
        
        // Schedule first progress update
        const delay = Math.random() * (maxDelay - minDelay) + minDelay;
        const timeoutId = setTimeout(simulate, delay);
        this.activeSimulations.set(jobId, timeoutId);
        return;
      }
      
      // Stop if job is no longer in progress
      if (job.status !== 'in_progress') {
        this.stopSimulation(jobId);
        return;
      }
      
      // Random progress jump (3-15% for slower progression)
      const jump = Math.floor(Math.random() * 12) + 3;
      const newProgress = Math.min(job.progress + jump, 100);
      
      // Random log message
      const logMessage = logMessages.length > 0
        ? logMessages[Math.floor(Math.random() * logMessages.length)]
        : `Progress update: ${newProgress}%`;
      
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      const updates = {
        progress: newProgress,
        logs: [...job.logs, `[${timestamp}] ${logMessage}`],
        summaryMessage: logMessage
      };
      
      // If reached 100%, complete or fail
      if (newProgress >= 100) {
        const success = Math.random() < successRate;
        updates.status = success ? 'completed' : 'failed';
        updates.finished = new Date().toISOString();
        updates.progress = success ? 100 : job.progress;
        updates.read = false;
        
        if (!success) {
          updates.errorMessage = this.getRandomError();
          updates.summaryMessage = 'Failed';
        } else {
          updates.summaryMessage = 'Completed successfully';
        }
        
        this.stopSimulation(jobId);
      }
      
      await updateJob(jobId, updates);
      
      // Schedule next update
      if (newProgress < 100) {
        const delay = Math.random() * (maxDelay - minDelay) + minDelay;
        const timeoutId = setTimeout(simulate, delay);
        this.activeSimulations.set(jobId, timeoutId);
      }
    };
    
    // Start the simulation after initial delay (queued phase)
    const timeoutId = setTimeout(simulate, initialDelay);
    this.activeSimulations.set(jobId, timeoutId);
  }
  
  stopSimulation(jobId) {
    if (this.activeSimulations.has(jobId)) {
      clearTimeout(this.activeSimulations.get(jobId));
      this.activeSimulations.delete(jobId);
    }
  }
  
  stopAllSimulations() {
    this.activeSimulations.forEach((timeout, jobId) => {
      clearTimeout(timeout);
    });
    this.activeSimulations.clear();
  }
  
  getRandomError() {
    const errors = [
      'Network timeout exceeded',
      'Insufficient disk space available',
      'Service temporarily unavailable',
      'Configuration validation failed',
      'Permission denied - access restricted',
      'Dependency resolution failed',
      'Build process encountered errors',
      'System resources exhausted'
    ];
    return errors[Math.floor(Math.random() * errors.length)];
  }
}

export const jobSimulator = new JobSimulator();

