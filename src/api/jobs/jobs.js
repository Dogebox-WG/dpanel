import ApiClient from '/api/client.js';
import { store } from '/state/store.js';
import {
  createJobMock,
  getAllJobsMock,
  getJobMock,
  getActiveJobsMock,
  getRecentJobsMock,
  getJobStatsMock,
  getCriticalJobStatusMock,
  cancelJobMock,
  markJobAsReadMock,
  markAllJobsAsReadMock,
  clearCompletedJobsMock
} from './jobs.mocks.js';

const client = new ApiClient(store.networkContext.apiBaseUrl);

// Create a new job (for testing/development)
export async function createJob(jobData) {
  return client.post('/jobs', jobData, { mock: createJobMock });
}

// Get all jobs
export async function getAllJobs() {
  return client.get('/jobs', { mock: getAllJobsMock });
}

// Get a single job by ID
export async function getJob(jobId) {
  return client.get(`/jobs/${jobId}`, { mock: getJobMock });
}

// Get active jobs (queued or in progress)
export async function getActiveJobs() {
  return client.get('/jobs/active', { mock: getActiveJobsMock });
}

// Get recent completed/failed jobs
export async function getRecentJobs(limit = 50) {
  return client.get(`/jobs/recent?limit=${limit}`, { mock: getRecentJobsMock });
}

// Get job statistics
export async function getJobStats() {
  return client.get('/jobs/stats', { mock: getJobStatsMock });
}

// Check if a critical job is running
export async function getCriticalJobStatus() {
  return client.get('/jobs/critical-status', { mock: getCriticalJobStatusMock });
}

// Cancel a running job
export async function cancelJob(jobId) {
  return client.post(`/jobs/${jobId}/cancel`, {}, { mock: cancelJobMock });
}

// Mark a job as read
export async function markJobAsRead(jobId) {
  return client.post(`/jobs/${jobId}/read`, {}, { mock: markJobAsReadMock });
}

// Mark all jobs as read
export async function markAllJobsAsRead() {
  return client.post('/jobs/read-all', {}, { mock: markAllJobsAsReadMock });
}

// Clear old completed jobs
export async function clearCompletedJobs(olderThanDays = 30) {
  return client.post('/jobs/clear-completed', { olderThanDays }, { mock: clearCompletedJobsMock });
}

// Clear ALL jobs (development only)
export async function clearAllJobs() {
  return client.post('/jobs/clear-all', {});
}

