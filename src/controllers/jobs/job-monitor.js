import { store } from '/state/store.js';
import { jobSimulator } from '/utils/job-simulator.js';

class JobMonitor {
  constructor() {
    this.started = false;
    this.stateChangedHandler = null;
  }
  
  start() {
    if (this.started) return;
    this.started = true;
    
    // Find all in-progress jobs and start simulations
    this.startActiveJobSimulations();
    
    // Subscribe to store changes to auto-start new jobs
    this.stateChangedHandler = {
      stateChanged: () => {
        this.startActiveJobSimulations();
      }
    };
    
    store.subscribe(this.stateChangedHandler);
  }
  
  startActiveJobSimulations() {
    const { jobs } = store.jobsContext;
    
    // Get all jobs sorted by creation order (assuming lower ID = created earlier)
    const allActiveJobs = jobs.filter(j => j.status === 'queued' || j.status === 'in_progress').sort((a, b) => a.id - b.id);
    
    // Get list of all jobs with active simulations (could include completed/failed jobs that haven't cleaned up yet)
    const allRunningSimulations = Array.from(jobSimulator.activeSimulations.keys());
    const runningSimulationCount = allRunningSimulations.length;
    
    // Check if there's a critical job with an active simulation
    const criticalJobRunning = allActiveJobs.find(j => 
      j.sensitive && jobSimulator.activeSimulations.has(j.id)
    );
    
    // If a critical job is running, don't start any new jobs (let it finish alone)
    if (criticalJobRunning) {
      console.log('[Job Monitor] Critical job running, waiting for it to complete:', criticalJobRunning.displayName);
      return;
    }
    
    // Find the next job to process (first one without an active simulation)
    const nextJob = allActiveJobs.find(j => !jobSimulator.activeSimulations.has(j.id));
    
    // If the next job is critical
    if (nextJob && nextJob.sensitive) {
      console.log('[Job Monitor] Next job is critical:', nextJob.displayName, 'Active simulations:', runningSimulationCount);
      
      // CRITICAL: Only start it if ABSOLUTELY NO other jobs are running
      // Check both the filtered active jobs AND the raw simulation count
      if (runningSimulationCount === 0) {
        console.log('[Job Monitor] Starting critical job:', nextJob.displayName);
        jobSimulator.startSimulation(nextJob.id);
      } else {
        console.log('[Job Monitor] Waiting for', runningSimulationCount, 'active simulations to complete before starting critical job');
      }
      // Don't start any other jobs while waiting for critical job
      return;
    }
    
    // If we get here, next job is non-critical (or there is no next job)
    // Process jobs in queue order, but stop when we hit a critical job
    for (const job of allActiveJobs) {
      // If we encounter a critical job that hasn't started, stop processing queue
      if (job.sensitive && !jobSimulator.activeSimulations.has(job.id)) {
        console.log('[Job Monitor] Encountered waiting critical job, stopping queue processing');
        break;
      }
      
      // Start non-critical jobs that haven't been started yet
      if (!job.sensitive && !jobSimulator.activeSimulations.has(job.id)) {
        console.log('[Job Monitor] Starting non-critical job:', job.displayName);
        jobSimulator.startSimulation(job.id);
      }
    }
  }
  
  stop() {
    jobSimulator.stopAllSimulations();
    this.started = false;
    
    // Remove subscription
    if (this.stateChangedHandler) {
      const index = store.subscribers.indexOf(this.stateChangedHandler);
      if (index > -1) {
        store.subscribers.splice(index, 1);
      }
      this.stateChangedHandler = null;
    }
  }
}

export const jobMonitor = new JobMonitor();

