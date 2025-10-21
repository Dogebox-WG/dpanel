// Test helpers
import { html, fixture, expect, waitUntil, aTimeout } from '../../../../dev/node_modules/@open-wc/testing';
import { sendKeys } from '../../../../dev/node_modules/@web/test-runner-commands';

// Component being tested
import '../index.js';

describe('JobActivityPage', () => {
  const createMockJob = (overrides = {}) => ({
    id: `job-${Date.now()}-${Math.random()}`,
    status: 'in_progress',
    progress: 50,
    displayName: 'Install Test App',
    summaryMessage: 'Installing packages...',
    started: new Date().toISOString(),
    finished: null,
    errorMessage: '',
    ...overrides
  });

  beforeEach(async () => {
    // Import and set up the store
    const { store } = await import('/state/store.js');
    
    // Initialize store with test data
    store.jobsContext = {
      jobs: []
    };
    
    // Ensure updateState method exists
    if (!store.updateState) {
      store.updateState = (state) => {
        Object.assign(store, state);
      };
    }
  });

  describe('Page Rendering', () => {
    it('renders page content', async () => {
      const { store } = await import('/state/store.js');
      store.jobsContext = { jobs: [], loading: false, error: null };
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      
      // Verify the page renders with the main container
      const padded = el.shadowRoot.querySelector('.padded');
      expect(padded).to.exist;
      
      // Verify filters section exists
      const filters = el.shadowRoot.querySelector('.filters');
      expect(filters).to.exist;
    });

    it('renders search box', async () => {
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      
      const searchInput = el.shadowRoot.querySelector('sl-input[placeholder="Search jobs..."]');
      expect(searchInput).to.exist;
    });

    it('renders status filter', async () => {
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      
      const statusFilter = el.shadowRoot.querySelector('sl-select');
      expect(statusFilter).to.exist;
    });

    it('renders job sections', async () => {
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      
      const sections = el.shadowRoot.querySelectorAll('.section');
      expect(sections.length).to.be.greaterThan(0);
    });
  });

  describe('Job Sections', () => {
    it('displays active jobs section', async () => {
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      
      const sectionTitles = Array.from(el.shadowRoot.querySelectorAll('.section-title'))
        .map(t => t.textContent.trim());
      
      expect(sectionTitles).to.include('Active Jobs');
    });

    it('displays pending jobs section', async () => {
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      
      const sectionTitles = Array.from(el.shadowRoot.querySelectorAll('.section-title'))
        .map(t => t.textContent.trim());
      
      expect(sectionTitles).to.include('Pending Jobs');
    });

    it('displays completed jobs section', async () => {
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      
      const sectionTitles = Array.from(el.shadowRoot.querySelectorAll('.section-title'))
        .map(t => t.textContent.trim());
      
      expect(sectionTitles).to.include('Recently Completed Jobs');
    });

    it('shows empty state when no jobs in section', async () => {
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      
      const emptyStates = el.shadowRoot.querySelectorAll('.empty-state');
      expect(emptyStates.length).to.be.greaterThan(0);
    });

    it('renders job-progress components for each job', async () => {
      const { store } = await import('/state/store.js');
      const jobs = [
        createMockJob({ id: 'job-1', status: 'in_progress' }),
        createMockJob({ id: 'job-2', status: 'in_progress' })
      ];
      
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      const jobProgress = el.shadowRoot.querySelectorAll('job-progress');
      expect(jobProgress.length).to.be.greaterThan(0);
    });
  });

  describe('Pagination', () => {
    it('shows limited jobs initially', async () => {
      const { store } = await import('/state/store.js');
      const jobs = Array.from({ length: 15 }, (_, i) => 
        createMockJob({ id: `job-${i}`, status: 'in_progress' })
      );
      
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      // Should show initial limit (10)
      expect(el.showActiveLimit).to.equal(10);
    });

    it('shows show more button when more jobs exist', async () => {
      const { store } = await import('/state/store.js');
      const jobs = Array.from({ length: 15 }, (_, i) => 
        createMockJob({ id: `job-${i}`, status: 'in_progress' })
      );
      
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      const showMoreBtn = el.shadowRoot.querySelector('.show-more-btn');
      expect(showMoreBtn).to.exist;
    });

    it('loads more jobs on button click', async () => {
      const { store } = await import('/state/store.js');
      const jobs = Array.from({ length: 15 }, (_, i) => 
        createMockJob({ id: `job-${i}`, status: 'in_progress' })
      );
      
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      const initialLimit = el.showActiveLimit;
      
      const showMoreBtn = el.shadowRoot.querySelector('.show-more-btn');
      showMoreBtn.click();
      await el.updateComplete;
      
      expect(el.showActiveLimit).to.be.greaterThan(initialLimit);
    });
  });

  describe('Search Filter', () => {
    it('filters jobs by display name', async () => {
      const jobs = [
        createMockJob({ id: 'job-1', displayName: 'Install App A' }),
        createMockJob({ id: 'job-2', displayName: 'Install App B' })
      ];
      
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      const searchInput = el.shadowRoot.querySelector('sl-input[placeholder="Search jobs..."]');
      searchInput.value = 'App A';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      await el.updateComplete;
      
      expect(el.searchQuery).to.equal('app a');
    });

    it('filters jobs by summary message', async () => {
      const jobs = [
        createMockJob({ id: 'job-1', summaryMessage: 'Downloading packages' }),
        createMockJob({ id: 'job-2', summaryMessage: 'Installing dependencies' })
      ];
      
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      el.searchQuery = 'downloading';
      await el.updateComplete;
      
      const filteredJobs = el.filterJobs(jobs);
      expect(filteredJobs.length).to.be.greaterThan(0);
    });

    it('filters jobs by error message', async () => {
      const jobs = [
        createMockJob({ id: 'job-1', errorMessage: 'Connection failed' }),
        createMockJob({ id: 'job-2', errorMessage: 'Timeout error' })
      ];
      
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      el.searchQuery = 'connection';
      await el.updateComplete;
      
      const filteredJobs = el.filterJobs(jobs);
      expect(filteredJobs.length).to.be.greaterThan(0);
    });

    it('performs case-insensitive search', async () => {
      const jobs = [
        createMockJob({ id: 'job-1', displayName: 'Install App' })
      ];
      
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      // Set search query to lowercase (as handleSearchInput does)
      el.searchQuery = 'install';
      await el.updateComplete;
      
      const filteredJobs = el.filterJobs(jobs);
      expect(filteredJobs.length).to.equal(1);
    });

    it('clears search filter', async () => {
      const jobs = [createMockJob({ id: 'job-1' })];
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      el.searchQuery = 'test';
      await el.updateComplete;
      
      const searchInput = el.shadowRoot.querySelector('sl-input[placeholder="Search jobs..."]');
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      await el.updateComplete;
      
      expect(el.searchQuery).to.equal('');
    });
  });

  describe('Status Filter', () => {
    it('filters by all (show all)', async () => {
      const jobs = [
        createMockJob({ id: 'job-1', status: 'in_progress' }),
        createMockJob({ id: 'job-2', status: 'completed' })
      ];
      
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      el.statusFilter = 'all';
      await el.updateComplete;
      
      const filteredJobs = el.filterJobs(jobs);
      expect(filteredJobs.length).to.equal(2);
    });

    it('filters by in_progress', async () => {
      const jobs = [
        createMockJob({ id: 'job-1', status: 'in_progress' }),
        createMockJob({ id: 'job-2', status: 'completed' })
      ];
      
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      el.statusFilter = 'in_progress';
      await el.updateComplete;
      
      const filteredJobs = el.filterJobs(jobs);
      expect(filteredJobs.length).to.equal(1);
      expect(filteredJobs[0].status).to.equal('in_progress');
    });

    it('filters by queued', async () => {
      const jobs = [
        createMockJob({ id: 'job-1', status: 'queued' }),
        createMockJob({ id: 'job-2', status: 'in_progress' })
      ];
      
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      el.statusFilter = 'queued';
      await el.updateComplete;
      
      const filteredJobs = el.filterJobs(jobs);
      expect(filteredJobs.length).to.equal(1);
      expect(filteredJobs[0].status).to.equal('queued');
    });

    it('filters by completed', async () => {
      const jobs = [
        createMockJob({ id: 'job-1', status: 'completed' }),
        createMockJob({ id: 'job-2', status: 'in_progress' })
      ];
      
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      el.statusFilter = 'completed';
      await el.updateComplete;
      
      const filteredJobs = el.filterJobs(jobs);
      expect(filteredJobs.length).to.equal(1);
      expect(filteredJobs[0].status).to.equal('completed');
    });

    it('filters by failed', async () => {
      const jobs = [
        createMockJob({ id: 'job-1', status: 'failed' }),
        createMockJob({ id: 'job-2', status: 'in_progress' })
      ];
      
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      el.statusFilter = 'failed';
      await el.updateComplete;
      
      const filteredJobs = el.filterJobs(jobs);
      expect(filteredJobs.length).to.equal(1);
      expect(filteredJobs[0].status).to.equal('failed');
    });

    it('filters by cancelled', async () => {
      const jobs = [
        createMockJob({ id: 'job-1', status: 'cancelled' }),
        createMockJob({ id: 'job-2', status: 'in_progress' })
      ];
      
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      el.statusFilter = 'cancelled';
      await el.updateComplete;
      
      const filteredJobs = el.filterJobs(jobs);
      expect(filteredJobs.length).to.equal(1);
      expect(filteredJobs[0].status).to.equal('cancelled');
    });
  });

  describe('Date Filter', () => {
    it('filters by all time', async () => {
      const jobs = [
        createMockJob({ id: 'job-1', started: new Date().toISOString() })
      ];
      
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      el.dateFilter = 'all';
      await el.updateComplete;
      
      const filteredJobs = el.filterJobs(jobs);
      expect(filteredJobs.length).to.equal(1);
    });

    it('filters by today', async () => {
      const jobs = [
        createMockJob({ id: 'job-1', started: new Date().toISOString() })
      ];
      
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      el.dateFilter = 'today';
      await el.updateComplete;
      
      const filteredJobs = el.filterJobs(jobs);
      expect(filteredJobs.length).to.be.greaterThan(0);
    });

    it('filters by past week', async () => {
      const jobs = [
        createMockJob({ id: 'job-1', started: new Date().toISOString() })
      ];
      
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      el.dateFilter = 'week';
      await el.updateComplete;
      
      const filteredJobs = el.filterJobs(jobs);
      expect(filteredJobs.length).to.be.greaterThan(0);
    });

    it('filters by past month', async () => {
      const jobs = [
        createMockJob({ id: 'job-1', started: new Date().toISOString() })
      ];
      
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      el.dateFilter = 'month';
      await el.updateComplete;
      
      const filteredJobs = el.filterJobs(jobs);
      expect(filteredJobs.length).to.be.greaterThan(0);
    });
  });

  describe('Combined Filters', () => {
    it('applies search + status filter together', async () => {
      const jobs = [
        createMockJob({ id: 'job-1', displayName: 'Install App A', status: 'in_progress' }),
        createMockJob({ id: 'job-2', displayName: 'Install App B', status: 'completed' })
      ];
      
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      el.searchQuery = 'app a';
      el.statusFilter = 'in_progress';
      await el.updateComplete;
      
      const filteredJobs = el.filterJobs(jobs);
      expect(filteredJobs.length).to.equal(1);
      expect(filteredJobs[0].displayName).to.include('App A');
      expect(filteredJobs[0].status).to.equal('in_progress');
    });

    it('applies search + date filter together', async () => {
      const jobs = [
        createMockJob({ id: 'job-1', displayName: 'Install App A', started: new Date().toISOString() })
      ];
      
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      el.searchQuery = 'app a';
      el.dateFilter = 'today';
      await el.updateComplete;
      
      const filteredJobs = el.filterJobs(jobs);
      expect(filteredJobs.length).to.be.greaterThan(0);
    });

    it('applies status + date filter together', async () => {
      const jobs = [
        createMockJob({ id: 'job-1', status: 'in_progress', started: new Date().toISOString() })
      ];
      
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      el.statusFilter = 'in_progress';
      el.dateFilter = 'today';
      await el.updateComplete;
      
      const filteredJobs = el.filterJobs(jobs);
      expect(filteredJobs.length).to.be.greaterThan(0);
    });

    it('applies all filters together', async () => {
      const jobs = [
        createMockJob({ 
          id: 'job-1', 
          displayName: 'Install App A', 
          status: 'in_progress',
          started: new Date().toISOString()
        })
      ];
      
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      el.searchQuery = 'app a';
      el.statusFilter = 'in_progress';
      el.dateFilter = 'today';
      await el.updateComplete;
      
      const filteredJobs = el.filterJobs(jobs);
      expect(filteredJobs.length).to.be.greaterThan(0);
    });
  });

  describe('Show More Functionality', () => {
    it('showMoreActive increases limit by 10', async () => {
      const { store } = await import('/state/store.js');
      const jobs = Array.from({ length: 25 }, (_, i) => 
        createMockJob({ id: `job-${i}`, status: 'in_progress' })
      );
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      
      const initialLimit = el.showActiveLimit;
      el.showMoreActive();
      
      expect(el.showActiveLimit).to.equal(initialLimit + 10);
    });

    it('showMorePending increases limit by 10', async () => {
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = [];
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      
      const initialLimit = el.showPendingLimit;
      el.showMorePending();
      
      expect(el.showPendingLimit).to.equal(initialLimit + 10);
    });

    it('showMoreCompleted increases limit by 10', async () => {
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = [];
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      
      const initialLimit = el.showCompletedLimit;
      el.showMoreCompleted();
      
      expect(el.showCompletedLimit).to.equal(initialLimit + 10);
    });

    it('can show more multiple times', async () => {
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = [];
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      
      const initialLimit = el.showActiveLimit;
      el.showMoreActive();
      el.showMoreActive();
      el.showMoreActive();
      
      expect(el.showActiveLimit).to.equal(initialLimit + 30);
    });
  });

  describe('Reactivity and Updates', () => {
    it('updates when store jobs change', async () => {
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = [];
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      
      // Initially no jobs
      let jobProgress = el.shadowRoot.querySelectorAll('job-progress');
      expect(jobProgress.length).to.equal(0);
      
      // Add jobs to store
      store.updateState({
        jobsContext: {
          jobs: [createMockJob({ id: 'new-job', status: 'in_progress' })]
        }
      });
      
      await el.updateComplete;
      await aTimeout(100);
      
      // Should now have job displayed
      jobProgress = el.shadowRoot.querySelectorAll('job-progress');
      expect(jobProgress.length).to.be.greaterThan(0);
    });

    it('handles rapid job updates', async () => {
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = [];
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      
      // Rapidly update jobs
      for (let i = 0; i < 5; i++) {
        store.updateState({
          jobsContext: {
            jobs: [createMockJob({ id: `job-${i}`, status: 'in_progress' })]
          }
        });
      }
      
      await el.updateComplete;
      await aTimeout(100);
      
      // Component should still be functional
      const padded = el.shadowRoot.querySelector('.padded');
      expect(padded).to.exist;
    });
  });

  describe('Edge Cases and Boundaries', () => {
    it('handles zero jobs gracefully', async () => {
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = [];
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      
      const emptyStates = el.shadowRoot.querySelectorAll('.empty-state');
      expect(emptyStates.length).to.be.greaterThan(0);
    });

    it('handles exactly 10 jobs (at limit)', async () => {
      const { store } = await import('/state/store.js');
      const jobs = Array.from({ length: 10 }, (_, i) => 
        createMockJob({ id: `job-${i}`, status: 'in_progress' })
      );
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      // Should not show "show more" button at exactly the limit
      const showMoreBtn = el.shadowRoot.querySelector('.show-more-btn');
      expect(showMoreBtn).to.be.null;
    });

    it('handles very large number of jobs', async () => {
      const { store } = await import('/state/store.js');
      const jobs = Array.from({ length: 1000 }, (_, i) => 
        createMockJob({ id: `job-${i}`, status: 'in_progress' })
      );
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      // Should still render (with pagination)
      const jobProgress = el.shadowRoot.querySelectorAll('job-progress');
      expect(jobProgress.length).to.equal(10); // Initial limit
    });

    it('handles jobs with missing optional fields', async () => {
      const { store } = await import('/state/store.js');
      const jobs = [
        {
          id: 'minimal-job',
          status: 'in_progress',
          progress: 0,
          displayName: 'Minimal Job',
          summaryMessage: '',
          started: new Date().toISOString(),
          finished: null,
          errorMessage: null
        }
      ];
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      const jobProgress = el.shadowRoot.querySelectorAll('job-progress');
      expect(jobProgress.length).to.equal(1);
    });

    it('handles filter with no matching results', async () => {
      const { store } = await import('/state/store.js');
      const jobs = [
        createMockJob({ id: 'job-1', displayName: 'Install App', status: 'completed' })
      ];
      store.jobsContext.jobs = jobs;
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      await aTimeout(100);
      
      // Filter for something that doesn't exist
      el.searchQuery = 'nonexistent';
      el.statusFilter = 'failed';
      await el.updateComplete;
      
      const filteredJobs = el.filterJobs(jobs);
      expect(filteredJobs.length).to.equal(0);
    });
  });

  describe('Component Lifecycle', () => {
    it('initializes with default values', async () => {
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = [];
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      
      expect(el.showActiveLimit).to.equal(10);
      expect(el.showPendingLimit).to.equal(10);
      expect(el.showCompletedLimit).to.equal(10);
      expect(el.searchQuery).to.equal('');
      expect(el.statusFilter).to.equal('all');
      expect(el.dateFilter).to.equal('all');
    });

    it('maintains state across updates', async () => {
      const { store } = await import('/state/store.js');
      store.jobsContext.jobs = [];
      
      const el = await fixture(html`<x-page-activity></x-page-activity>`);
      await el.updateComplete;
      
      // Change some properties
      el.searchQuery = 'test';
      el.statusFilter = 'completed';
      el.showActiveLimit = 20;
      
      // Trigger update
      await el.updateComplete;
      
      // State should be preserved
      expect(el.searchQuery).to.equal('test');
      expect(el.statusFilter).to.equal('completed');
      expect(el.showActiveLimit).to.equal(20);
    });
  });
});

