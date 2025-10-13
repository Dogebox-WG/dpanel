import ApiClient from '/api/client.js';
import { store } from '/state/store.js';
import { mockActivityApi } from './jobs.mocks.js';

const client = new ApiClient(store.networkContext.apiBaseUrl);

// Helper to choose mock or real
function useMock(mockFn, realFn) {
  return store.networkContext.useMocks ? mockFn : realFn;
}

// GET all activities (jobs)
export async function getAllActivities() {
  return useMock(
    () => mockActivityApi.getAllActivities(),
    () => client.get('/jobs')
  )();
}

// GET specific activity (job)
export async function getActivity(activityId) {
  return useMock(
    () => mockActivityApi.getActivity(activityId),
    () => client.get(`/jobs/${activityId}`)
  )();
}

// Mark activity as read
export async function markActivityAsRead(activityId) {
  return useMock(
    () => mockActivityApi.markActivityAsRead(activityId),
    () => client.post(`/jobs/${activityId}/read`, {})
  )();
}

// Mark all activities as read
export async function markAllActivitiesAsRead() {
  return useMock(
    () => mockActivityApi.markAllActivitiesAsRead(),
    () => client.post('/jobs/read-all', {})
  )();
}

// Clear completed activities
export async function clearCompletedActivities(olderThanDays = 0) {
  return useMock(
    () => mockActivityApi.clearCompletedActivities(olderThanDays),
    () => client.post('/jobs/clear-completed', { olderThanDays })
  )();
}

// Cancel a job (not used in UI, but available for programmatic use)
export async function cancelJob(jobId) {
  return useMock(
    () => Promise.resolve({ success: true, message: 'Mock job cancelled' }),
    () => client.post(`/jobs/${jobId}/cancel`, {})
  )();
}

// Deprecated - keeping for backward compatibility during migration
export const markAllJobsAsRead = markAllActivitiesAsRead;
export const clearCompletedJobs = clearCompletedActivities;
