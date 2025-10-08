import ApiClient from '/api/client.js';
import { store } from '/state/store.js';
import { getAllJobsMock, createJobMock, updateJobMock } from './jobs.mocks.js';

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function getAllJobs() {
  return client.get('/jobs', { mock: getAllJobsMock });
}

export async function createJob(jobData) {
  return client.post('/jobs', jobData, { mock: createJobMock });
}

export async function updateJob(jobId, updates) {
  return client.request(`/jobs/${jobId}`, {
    method: 'PATCH',
    body: updates,
    mock: updateJobMock
  });
}

