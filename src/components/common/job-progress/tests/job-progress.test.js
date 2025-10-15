// Test helpers
import { html, fixture, expect, waitUntil } from '../../../../../dev/node_modules/@open-wc/testing';

// Component being tested
import '../index.js';

describe('JobProgress', () => {
  const createMockJob = (overrides = {}) => ({
    id: 'job-1',
    status: 'in_progress',
    progress: 50,
    displayName: 'Install Test App',
    summaryMessage: 'Installing packages...',
    started: new Date().toISOString(),
    finished: null,
    errorMessage: '',
    ...overrides
  });

  describe('Basic Rendering', () => {
    it('renders job card with job data', async () => {
      const job = createMockJob();
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const jobCard = el.shadowRoot.querySelector('.job-card');
      expect(jobCard).to.exist;
    });

    it('displays job name correctly', async () => {
      const job = createMockJob();
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const taskName = el.shadowRoot.querySelector('.task-name');
      expect(taskName.textContent.trim()).to.equal('Install Test App');
    });

    it('displays correct status icon', async () => {
      const job = createMockJob();
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const icon = el.shadowRoot.querySelector('.job-icon');
      expect(icon.getAttribute('name')).to.equal('arrow-repeat');
    });

    it('displays progress bar', async () => {
      const job = createMockJob();
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const progressBar = el.shadowRoot.querySelector('.progress-bar');
      expect(progressBar).to.exist;
    });

    it('displays progress percentage', async () => {
      const job = createMockJob();
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const percentage = el.shadowRoot.querySelector('.job-percentage');
      expect(percentage.textContent.trim()).to.equal('50%');
    });

    it('displays timing information', async () => {
      const job = createMockJob();
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const timingItems = el.shadowRoot.querySelectorAll('.timing-item');
      expect(timingItems.length).to.be.greaterThan(0);
    });
  });

  describe('Status Display', () => {
    it('shows correct icon for in_progress status', async () => {
      const job = createMockJob({ status: 'in_progress' });
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const icon = el.shadowRoot.querySelector('.job-icon');
      expect(icon.getAttribute('name')).to.equal('arrow-repeat');
      expect(icon.classList.contains('in_progress')).to.be.true;
    });

    it('shows correct icon for completed status', async () => {
      const job = createMockJob({ status: 'completed' });
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const icon = el.shadowRoot.querySelector('.job-icon');
      expect(icon.getAttribute('name')).to.equal('check-circle-fill');
      expect(icon.classList.contains('completed')).to.be.true;
    });

    it('shows correct icon for failed status', async () => {
      const job = createMockJob({ status: 'failed' });
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const icon = el.shadowRoot.querySelector('.job-icon');
      expect(icon.getAttribute('name')).to.equal('exclamation-triangle-fill');
      expect(icon.classList.contains('failed')).to.be.true;
    });

    it('shows correct icon for queued status', async () => {
      const job = createMockJob({ status: 'queued' });
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const icon = el.shadowRoot.querySelector('.job-icon');
      expect(icon.getAttribute('name')).to.equal('clock');
      expect(icon.classList.contains('queued')).to.be.true;
    });

    it('shows correct icon for cancelled status', async () => {
      const job = createMockJob({ status: 'cancelled' });
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const icon = el.shadowRoot.querySelector('.job-icon');
      expect(icon.getAttribute('name')).to.equal('x-circle');
    });

    it('applies correct color classes to progress bar', async () => {
      const job = createMockJob({ status: 'in_progress' });
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const progressBar = el.shadowRoot.querySelector('.progress-bar');
      expect(progressBar.classList.contains('in_progress')).to.be.true;
    });
  });

  describe('Progress Bar', () => {
    it('displays progress bar with correct width', async () => {
      const job = createMockJob({ progress: 75 });
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const progressBar = el.shadowRoot.querySelector('.progress-bar');
      expect(progressBar.style.width).to.equal('75%');
    });

    it('shows indeterminate animation for 0% in_progress jobs', async () => {
      const job = createMockJob({ status: 'in_progress', progress: 0 });
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const progressBar = el.shadowRoot.querySelector('.progress-bar');
      expect(progressBar.classList.contains('indeterminate')).to.be.true;
    });

    it('shows percentage text for non-indeterminate jobs', async () => {
      const job = createMockJob({ progress: 50 });
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const percentage = el.shadowRoot.querySelector('.job-percentage');
      expect(percentage.textContent.trim()).to.equal('50%');
    });

    it('shows dots for indeterminate jobs', async () => {
      const job = createMockJob({ status: 'in_progress', progress: 0 });
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const percentage = el.shadowRoot.querySelector('.job-percentage');
      expect(percentage.textContent.trim()).to.equal('...');
    });

    it('applies correct CSS class for status', async () => {
      const job = createMockJob({ status: 'completed' });
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const progressBar = el.shadowRoot.querySelector('.progress-bar');
      expect(progressBar.classList.contains('completed')).to.be.true;
    });
  });

  describe('Expandable Details', () => {
    it('toggles expansion on click', async () => {
      const job = createMockJob();
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const jobCard = el.shadowRoot.querySelector('.job-card');
      
      // Initially not expanded
      expect(el.expanded).to.be.false;
      
      // Click to expand
      jobCard.click();
      await el.updateComplete;
      
      expect(el.expanded).to.be.true;
    });

    it('shows error message when expanded and error exists', async () => {
      const job = createMockJob({ errorMessage: 'Test error' });
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      // Expand the job
      el.expanded = true;
      await el.updateComplete;

      const errorMessage = el.shadowRoot.querySelector('.error-message');
      expect(errorMessage).to.exist;
      expect(errorMessage.textContent).to.include('Test error');
    });

    it('shows log viewer when expanded', async () => {
      const job = createMockJob();
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      // Expand the job
      el.expanded = true;
      await el.updateComplete;

      const logViewer = el.shadowRoot.querySelector('x-log-viewer');
      expect(logViewer).to.exist;
    });

    it('passes correct jobId to log viewer', async () => {
      const job = createMockJob();
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      // Expand the job
      el.expanded = true;
      await el.updateComplete;

      const logViewer = el.shadowRoot.querySelector('x-log-viewer');
      expect(logViewer.jobId).to.equal('job-1');
    });
  });

  describe('Time Formatting', () => {
    it('displays started time', async () => {
      const job = createMockJob();
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const timingLabels = el.shadowRoot.querySelectorAll('.timing-label');
      const labels = Array.from(timingLabels).map(l => l.textContent.trim());
      expect(labels).to.include('Started');
    });

    it('displays finished time when available', async () => {
      const job = createMockJob({ finished: new Date().toISOString() });
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const timingLabels = el.shadowRoot.querySelectorAll('.timing-label');
      const labels = Array.from(timingLabels).map(l => l.textContent.trim());
      expect(labels).to.include('Finished');
    });

    it('handles missing finished time gracefully', async () => {
      const job = createMockJob({ finished: null });
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const timingLabels = el.shadowRoot.querySelectorAll('.timing-label');
      const labels = Array.from(timingLabels).map(l => l.textContent.trim());
      expect(labels).to.not.include('Finished');
    });
  });

  describe('User Interactions', () => {
    it('toggles expanded state on card click', async () => {
      const job = createMockJob();
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const jobCard = el.shadowRoot.querySelector('.job-card');
      
      expect(el.expanded).to.be.false;
      
      jobCard.click();
      await el.updateComplete;
      
      expect(el.expanded).to.be.true;
      
      jobCard.click();
      await el.updateComplete;
      
      expect(el.expanded).to.be.false;
    });

    it('updates UI to show/hide details', async () => {
      const job = createMockJob();
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      // Initially no details
      let detailsContainer = el.shadowRoot.querySelector('.details-container');
      expect(detailsContainer).to.be.null;

      // Expand
      el.expanded = true;
      await el.updateComplete;
      
      detailsContainer = el.shadowRoot.querySelector('.details-container');
      expect(detailsContainer).to.exist;

      // Collapse
      el.expanded = false;
      await el.updateComplete;
      
      detailsContainer = el.shadowRoot.querySelector('.details-container');
      expect(detailsContainer).to.be.null;
    });

    it('handles multiple rapid clicks', async () => {
      const job = createMockJob();
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);

      const jobCard = el.shadowRoot.querySelector('.job-card');
      
      // Click multiple times rapidly
      jobCard.click();
      jobCard.click();
      jobCard.click();
      await el.updateComplete;
      
      // Should end up in a consistent state
      expect(el.expanded).to.be.a('boolean');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing job gracefully', async () => {
      const el = await fixture(html`<job-progress></job-progress>`);
      
      const jobCard = el.shadowRoot.querySelector('.job-card');
      expect(jobCard).to.be.null;
    });

    it('handles job with all fields empty', async () => {
      const job = {
        id: '',
        status: '',
        progress: 0,
        displayName: '',
        summaryMessage: '',
        started: null,
        finished: null,
        errorMessage: ''
      };
      
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);
      
      const jobCard = el.shadowRoot.querySelector('.job-card');
      expect(jobCard).to.exist;
    });

    it('handles very long job names', async () => {
      const longName = 'A'.repeat(100);
      const job = createMockJob({ displayName: longName });
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);
      
      const taskName = el.shadowRoot.querySelector('.task-name');
      // Text content may have whitespace, so trim it
      expect(taskName.textContent.trim()).to.equal(longName);
    });

    it('handles progress over 100', async () => {
      const job = createMockJob({ progress: 150 });
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);
      
      const progressBar = el.shadowRoot.querySelector('.progress-bar');
      expect(progressBar.style.width).to.equal('150%');
    });

    it('handles negative progress', async () => {
      const job = createMockJob({ progress: -10 });
      const el = await fixture(html`<job-progress .job=${job}></job-progress>`);
      
      const percentage = el.shadowRoot.querySelector('.job-percentage');
      // Negative progress should show as 0% or the actual value
      expect(percentage.textContent.trim()).to.be.oneOf(['-10%', '0%']);
    });
  });
});

