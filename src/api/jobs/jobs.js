import ApiClient from '/api/client.js';
import { store } from '/state/store.js';
import { mockJobApi } from './jobs.mocks.js';

const client = new ApiClient(store.networkContext.apiBaseUrl);

// Helper to choose mock or real
function useMock(mockFn, realFn) {
  return store.networkContext.useMocks ? mockFn : realFn;
}

// GET all jobs
export async function getAllJobs() {
  return useMock(
    () => mockJobApi.getAllJobs(),
    () => client.get('/jobs')
  )();
}

// GET specific job
export async function getJob(jobId) {
  return useMock(
    () => mockJobApi.getJob(jobId),
    () => client.get(`/jobs/${jobId}`)
  )();
}

// Mark job as read
export async function markJobAsRead(jobId) {
  return useMock(
    () => mockJobApi.markJobAsRead(jobId),
    () => client.post(`/jobs/${jobId}/read`, {})
  )();
}

// Mark all jobs as read
export async function markAllJobsAsRead() {
  return useMock(
    () => mockJobApi.markAllJobsAsRead(),
    () => client.post('/jobs/read-all', {})
  )();
}

// Clear completed jobs
export async function clearCompletedJobs(olderThanDays = 0) {
  return useMock(
    () => mockJobApi.clearCompletedJobs(olderThanDays),
    () => client.post('/jobs/clear-completed', { olderThanDays })
  )();
}