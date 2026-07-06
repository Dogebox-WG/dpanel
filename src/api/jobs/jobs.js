import ApiClient from '/api/client.js';
import { store } from '/state/store.js';
import { mockJobApi } from './jobs.mocks.js';

const client = new ApiClient(store.networkContext.apiBaseUrl);

// Helper to choose mock or real
function useMock(mockFn, realFn) {
  const useMocks = store.networkContext.useMocks;
  return useMocks ? mockFn : realFn;
}

// GET all jobs
export async function getAllJobs() {
  const result = await useMock(
    () => mockJobApi.getAllJobs(),
    () => client.get('/jobs')
  )();
  return result;
}

// GET specific job
export async function getJob(jobId) {
  const result = await useMock(
    () => mockJobApi.getJob(jobId),
    () => client.get(`/jobs/${jobId}`)
  )();
  return result;
}

// DELETE specific job
export async function deleteJob(jobId) {
  const result = await useMock(
    () => mockJobApi.deleteJob(jobId),
    () => client.delete(`/jobs/${jobId}`)
  )();
  return result;
}

// POST create orphaned job candidate
export async function createOrphanedJobCandidate() {
  const result = await useMock(
    () => mockJobApi.createOrphanedJobCandidate(),
    () => client.post('/jobs/dev/create-orphan-candidate', {})
  )();
  return result;
}

// Clear completed jobs
export async function clearCompletedJobs(olderThanDays = 0) {
  const result = await useMock(
    () => mockJobApi.clearCompletedJobs(olderThanDays),
    () => client.post('/jobs/clear-completed', { olderThanDays })
  )();
  return result;
}