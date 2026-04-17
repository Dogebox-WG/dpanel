export class PaginationController {
  constructor(host, data = [], itemsPerPage = 10, options) {
    this.host = host;
    this.data = data;
    this.initial_data = data;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
    this.options = options;
  }

  setData(newData) {
    if (this?.options?.initialSort) {
      const sorted = newData.sort(this.options.initialSort)
      this.data = sorted;
      this.initial_data = sorted;
    } else {
      this.data = newData;
      this.initial_data = newData;
    }
    this.currentPage = 1;
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

  getCurrentPageData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.data.slice(startIndex, endIndex);
  }

  getTotalPages() {
    return Math.ceil(this.data.length / this.itemsPerPage);
  }

  setCurrentPage(page) {
    const totalPages = this.getTotalPages();
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.host.requestUpdate();
    }
  }

  setFilter(filterFn) {
    if (!filterFn) {
      this.data = this.initial_data;
      this.host.requestUpdate();
      return;
    }
    this.data = this.initial_data.filter(filterFn);
    this.host.requestUpdate();
  }
}