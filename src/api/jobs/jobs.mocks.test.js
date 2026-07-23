import { expect } from "../../../dev/node_modules/@open-wc/testing";

import { mockJobApi } from "/api/jobs/jobs.mocks.js";

describe("mockJobApi job IDs", () => {
  it("uses string IDs and requires an exact ID match", async () => {
    const { jobs } = await mockJobApi.getAllJobs();
    const job = jobs[0];

    expect(job.id).to.be.a("string");
    expect(job.id).to.match(/^mock-job-\d+$/);

    const exactMatch = await mockJobApi.getJob(job.id);
    const partialMatch = await mockJobApi.getJob(job.id.replace("mock-job-", ""));

    expect(exactMatch).to.include({ success: true, job });
    expect(partialMatch).to.deep.equal({ success: false, job: null });
  });

  it("deletes a job by its string ID", async () => {
    const { jobs } = await mockJobApi.getAllJobs();
    const job = jobs.at(-1);

    const result = await mockJobApi.deleteJob(job.id);
    const lookup = await mockJobApi.getJob(job.id);

    expect(result).to.deep.equal({ success: true, deleted: job.id });
    expect(lookup).to.deep.equal({ success: false, job: null });
  });
});
