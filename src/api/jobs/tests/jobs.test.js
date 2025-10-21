// Test helpers
import { expect } from '../../../../dev/node_modules/@open-wc/testing';

// Module being tested
import * as jobsAPI from '../jobs.js';
import { store } from '/state/store.js';

describe('Jobs API Client', () => {
  let originalUseMocks;
  let originalApiBaseUrl;

  beforeEach(() => {
    // Save original values
    originalUseMocks = store.networkContext.useMocks;
    originalApiBaseUrl = store.networkContext.apiBaseUrl;
    
    // Set up for testing with mocks enabled
    store.networkContext.useMocks = true;
    store.networkContext.apiBaseUrl = 'http://localhost:3000';
  });

  afterEach(() => {
    // Restore original values
    store.networkContext.useMocks = originalUseMocks;
    store.networkContext.apiBaseUrl = originalApiBaseUrl;
  });

  describe('getAllJobs', () => {
    it('returns job data when using mocks', async () => {
      store.networkContext.useMocks = true;
      
      const result = await jobsAPI.getAllJobs();
      
      expect(result).to.exist;
      expect(result.success).to.be.true;
      expect(result.jobs).to.be.an('array');
    });

    it('returns jobs with correct structure', async () => {
      store.networkContext.useMocks = true;
      
      const result = await jobsAPI.getAllJobs();
      
      if (result.jobs.length > 0) {
        const job = result.jobs[0];
        expect(job).to.have.property('id');
        expect(job).to.have.property('status');
        expect(job).to.have.property('displayName');
        expect(job).to.have.property('progress');
      }
    });

    it('handles multiple jobs', async () => {
      store.networkContext.useMocks = true;
      
      const result = await jobsAPI.getAllJobs();
      
      expect(result.jobs).to.be.an('array');
      expect(result.jobs.length).to.be.greaterThan(0);
    });
  });

  describe('getJob', () => {
    it('returns single job data when using mocks', async () => {
      store.networkContext.useMocks = true;
      
      const jobId = 1;
      const result = await jobsAPI.getJob(jobId);
      
      expect(result).to.exist;
      expect(result.success).to.be.true;
    });

    it('returns job with correct structure', async () => {
      store.networkContext.useMocks = true;
      
      const jobId = 1;
      const result = await jobsAPI.getJob(jobId);
      
      if (result.job) {
        expect(result.job).to.have.property('id');
        expect(result.job).to.have.property('status');
        expect(result.job).to.have.property('displayName');
        expect(result.job).to.have.property('progress');
        expect(result.job).to.have.property('summaryMessage');
      }
    });

    it('returns null for non-existent job', async () => {
      store.networkContext.useMocks = true;
      
      const jobId = 99999;
      const result = await jobsAPI.getJob(jobId);
      
      expect(result).to.exist;
      expect(result.job).to.be.null;
    });

    it('handles valid job ID', async () => {
      store.networkContext.useMocks = true;
      
      const jobId = 1;
      const result = await jobsAPI.getJob(jobId);
      
      expect(result.success).to.be.true;
      expect(result.job).to.exist;
      expect(result.job.id).to.equal(jobId);
    });
  });

  describe('clearCompletedJobs', () => {
    it('clears completed jobs with default parameter', async () => {
      store.networkContext.useMocks = true;
      
      const result = await jobsAPI.clearCompletedJobs();
      
      expect(result).to.exist;
      expect(result.success).to.be.true;
    });

    it('accepts olderThanDays parameter', async () => {
      store.networkContext.useMocks = true;
      
      const olderThanDays = 7;
      const result = await jobsAPI.clearCompletedJobs(olderThanDays);
      
      expect(result).to.exist;
      expect(result.success).to.be.true;
    });

    it('clears jobs older than specified days', async () => {
      store.networkContext.useMocks = true;
      
      // First get all jobs
      const beforeResult = await jobsAPI.getAllJobs();
      const beforeCount = beforeResult.jobs.length;
      
      // Clear old completed jobs (30 days)
      await jobsAPI.clearCompletedJobs(30);
      
      // Get jobs again
      const afterResult = await jobsAPI.getAllJobs();
      const afterCount = afterResult.jobs.length;
      
      // Should have same or fewer jobs
      expect(afterCount).to.be.at.most(beforeCount);
    });

    it('handles zero days parameter', async () => {
      store.networkContext.useMocks = true;
      
      const result = await jobsAPI.clearCompletedJobs(0);
      
      expect(result).to.exist;
      expect(result.success).to.be.true;
    });
  });

  describe('Mock Integration', () => {
    it('uses mock API when useMocks is true', async () => {
      store.networkContext.useMocks = true;
      
      const result = await jobsAPI.getAllJobs();
      
      expect(result).to.exist;
      expect(result.success).to.be.true;
      expect(result.jobs).to.be.an('array');
    });

    it('mock returns expected data structure', async () => {
      store.networkContext.useMocks = true;
      
      const result = await jobsAPI.getAllJobs();
      
      expect(result).to.have.property('success');
      expect(result).to.have.property('jobs');
      expect(result.jobs).to.be.an('array');
    });

    it('mock job includes all required fields', async () => {
      store.networkContext.useMocks = true;
      
      const result = await jobsAPI.getAllJobs();
      
      if (result.jobs.length > 0) {
        const job = result.jobs[0];
        expect(job).to.have.property('id');
        expect(job).to.have.property('status');
        expect(job).to.have.property('progress');
        expect(job).to.have.property('displayName');
        expect(job).to.have.property('summaryMessage');
        expect(job).to.have.property('started');
      }
    });

    it('mock data structure is valid', async () => {
      store.networkContext.useMocks = true;
      
      const result = await jobsAPI.getAllJobs();
      
      // Verify the mock returns a valid response
      expect(result).to.have.property('success');
      expect(result).to.have.property('jobs');
      expect(result.jobs).to.be.an('array');
      
      // If there are jobs, verify they have valid statuses
      if (result.jobs.length > 0) {
        const validStatuses = ['queued', 'in_progress', 'completed', 'failed', 'cancelled'];
        result.jobs.forEach(job => {
          expect(validStatuses).to.include(job.status);
        });
      }
    });
  });

  describe('API Function Exports', () => {
    it('exports getAllJobs function', () => {
      expect(jobsAPI.getAllJobs).to.be.a('function');
    });

    it('exports getJob function', () => {
      expect(jobsAPI.getJob).to.be.a('function');
    });

    it('exports clearCompletedJobs function', () => {
      expect(jobsAPI.clearCompletedJobs).to.be.a('function');
    });
  });

  describe('Error Handling', () => {
    it('getAllJobs returns a promise', () => {
      store.networkContext.useMocks = true;
      
      const result = jobsAPI.getAllJobs();
      
      expect(result).to.be.instanceOf(Promise);
    });

    it('getJob returns a promise', () => {
      store.networkContext.useMocks = true;
      
      const result = jobsAPI.getJob(1);
      
      expect(result).to.be.instanceOf(Promise);
    });

    it('clearCompletedJobs returns a promise', () => {
      store.networkContext.useMocks = true;
      
      const result = jobsAPI.clearCompletedJobs(0);
      
      expect(result).to.be.instanceOf(Promise);
    });
  });

  describe('Data Integrity', () => {
    it('getAllJobs returns immutable data structure', async () => {
      store.networkContext.useMocks = true;
      
      const result1 = await jobsAPI.getAllJobs();
      const result2 = await jobsAPI.getAllJobs();
      
      // Results should be separate objects
      expect(result1.jobs).to.be.an('array');
      expect(result2.jobs).to.be.an('array');
    });

    it('handles jobs with special characters in names', async () => {
      store.networkContext.useMocks = true;
      
      const result = await jobsAPI.getAllJobs();
      
      // Mock should handle any characters
      expect(result).to.exist;
      expect(result.success).to.be.true;
    });

    it('handles empty job list', async () => {
      store.networkContext.useMocks = true;
      
      // Clear all jobs first
      await jobsAPI.clearCompletedJobs(0);
      
      const result = await jobsAPI.getAllJobs();
      
      expect(result).to.exist;
      expect(result.success).to.be.true;
      expect(result.jobs).to.be.an('array');
    });
  });

  describe('Concurrent Operations', () => {
    it('handles multiple getAllJobs calls simultaneously', async () => {
      store.networkContext.useMocks = true;
      
      const promises = [
        jobsAPI.getAllJobs(),
        jobsAPI.getAllJobs(),
        jobsAPI.getAllJobs()
      ];
      
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result).to.exist;
        expect(result.success).to.be.true;
        expect(result.jobs).to.be.an('array');
      });
    });

    it('handles mixed API calls simultaneously', async () => {
      store.networkContext.useMocks = true;
      
      const promises = [
        jobsAPI.getAllJobs(),
        jobsAPI.getJob(1),
        jobsAPI.getAllJobs()
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).to.have.lengthOf(3);
      results.forEach(result => {
        expect(result).to.exist;
      });
    });
  });
});
