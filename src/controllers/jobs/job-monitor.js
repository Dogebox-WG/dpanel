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
    // Start simulations for both queued and in-progress jobs
    const activeJobs = jobs.filter(j => j.status === 'queued' || j.status === 'in_progress');
    
    activeJobs.forEach(job => {
      // Only start simulation if not already running
      if (!jobSimulator.activeSimulations.has(job.id)) {
        jobSimulator.startSimulation(job.id);
      }
    });
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

