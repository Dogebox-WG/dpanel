interface PaginationHost {
  requestUpdate(): void;
}

export interface PaginationOptions<T> {
  initialSort?: (a: T, b: T) => number;
}

export type PaginationFilterFn<T> = (item: T, query: string) => boolean;

export class PaginationController<T = unknown> {
  host: PaginationHost;
  data: T[];
  initial_data: T[];
  itemsPerPage: number;
  currentPage: number;
  options?: PaginationOptions<T>;
  filterFn: PaginationFilterFn<T> | null;
  query: string;

  constructor(
    host: PaginationHost,
    data: T[] = [],
    itemsPerPage = 10,
    options?: PaginationOptions<T>,
  ) {
    this.host = host;
    this.data = data;
    this.initial_data = data;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
    this.options = options;
    this.filterFn = null;
    this.query = "";
  }

  setData(newData: T[]) {
    if (this?.options?.initialSort) {
      const sorted = newData.sort(this.options.initialSort)
      this.data = sorted;
      this.initial_data = sorted;
    } else {
      this.data = newData;
      this.initial_data = newData;
    }
    this.currentPage = 1;
    this.applyFilter();
    this.host.requestUpdate();
  }

  nextPage = () => {
    const totalPages = Math.ceil(this.data.length / this.itemsPerPage);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.host.requestUpdate();
    }
  }

  previousPage = () => {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.host.requestUpdate();
    }
  }

  getCurrentPageData(): T[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.data.slice(startIndex, endIndex);
  }

  getTotalPages() {
    return Math.ceil(this.data.length / this.itemsPerPage);
  }

  setCurrentPage(page: number) {
    const totalPages = this.getTotalPages();
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.host.requestUpdate();
    }
  }

  /**
   * Register a stable filter once as (item, query) => boolean.
   * Update the query via setQuery() instead of recreating the filter.
   * Call with no args / null to clear.
   */
  setFilter(filterFn?: PaginationFilterFn<T> | null) {
    this.filterFn = filterFn || null;
    this.currentPage = 1;
    this.applyFilter();
    this.host.requestUpdate();
  }

  setQuery(query: string) {
    this.query = query ?? "";
    this.currentPage = 1;
    this.applyFilter();
    this.host.requestUpdate();
  }

  applyFilter() {
    if (!this.filterFn) {
      this.data = this.initial_data;
      return;
    }
    this.data = this.initial_data.filter((item) => this.filterFn!(item, this.query));
  }

  clearFilter() {
    this.filterFn = null;
    this.query = "";
    this.data = this.initial_data;
    this.currentPage = 1;
    this.host.requestUpdate();
  }
}
