import { LitElement, html, css, nothing, repeat } from '/lib/lit-all.js';

export class searchBase extends LitElement {
  // Pre-fill the search from URL query params if they exist, e.g.
  //   /explore?search=core-network&interfaces=1&description=1
  applySearchFromUrl() {
    const params = new URLSearchParams(window.location.search);

    const search = params.get('search') ?? params.get('q');
    if (search !== null) {
      this.searchValue = search;
    }

    const isTruthy = (v) => v !== null && ['1', 'true', 'yes'].includes(v.toLowerCase());
    if (params.has('interfaces')) {
      this.searchInInterfaces = isTruthy(params.get('interfaces'));
    }
    if (params.has('description')) {
      this.searchInDescription = isTruthy(params.get('description'));
    }
  }

  updateBusyState() {
    this.busy = this.busyQueue.length > 0;
  }

  handleBusyStart(event: Event) {
    if (event.target) this.busyQueue.push(event.target);
    this.updateBusyState();
  }

  handleBusyStop(event: Event) {
    // Remove the identifier of the event source from the queue
    const index = event.target ? this.busyQueue.indexOf(event.target) : -1;
    if (index > -1) {
      this.busyQueue.splice(index, 1);
    }
    setTimeout(() => {
      this.updateBusyState();
    }, 500);
  }

  handlePupInstalled(event: Event) {
    event.stopPropagation();
    if (!(event instanceof CustomEvent)) return;
    const detail: { pupid: string } = event.detail;
    // installPkg no longer exists on pkgController; guarded so a stray
    // pup-installed event (legacy card-pup-snapshot) cannot throw.
    const controller = this.pkgController;
    if ('installPkg' in controller && typeof controller.installPkg === 'function') {
      controller.installPkg(detail.pupid);
    }
    this.requestUpdate();
  }

  handlePupClick(event: Event) {
    const el = event.currentTarget;
    if (el instanceof HTMLElement && 'pupId' in el) {
      this.inspectedPup = typeof el.pupId === 'string' ? el.pupId : undefined;
    }
  }

  handleForcedTabShow(event: Event) {
    if (!(event instanceof CustomEvent)) return;
    const detail: { pupId: string } = event.detail;
    this.inspectedPup = detail.pupId
  }

  handleActionsMenuSelect(event: Event) {
    if (!(event instanceof CustomEvent)) return;
    const detail: { item: { value: string } } = event.detail;
    const selectedItemValue = detail.item.value;
    switch (selectedItemValue) {
      case 'refresh':
        this.fetchBootstrap();
        break;
    }
  }

  handleSearchInput(event: Event) {
    const target = event.target;
    if (target instanceof HTMLElement && 'value' in target && typeof target.value === 'string') {
      this.searchValue = target.value;
    }
  }

  handleSearchOptionChange(event: Event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const option = target.dataset.option;
    const checked = 'checked' in target ? Boolean(target.checked) : false;
    if (option === 'description') {
      this.searchInDescription = checked;
    } else if (option === 'interfaces') {
      this.searchInInterfaces = checked;
    }
  }

  // Collect the searchable text for a pup based on which search options are
  // currently enabled. Always includes the pup key + display name.
  getSearchableText(pkg: EnrichedPup) {
    const def = pkg?.def;
    const latestVersion = def?.latestVersion ?? "";
    // Older sources used descShort/descLong for the meta description keys.
    const meta: {
      name?: string;
      shortDescription?: string;
      longDescription?: string;
      descShort?: string;
      descLong?: string;
    } = def?.versions?.[latestVersion]?.meta || {};
    const version = def?.versions?.[latestVersion] || {};

    const parts = [def?.key || "", meta.name || ""];

    if (this.searchInDescription) {
      parts.push(
        meta.shortDescription || meta.descShort || "",
        meta.longDescription || meta.descLong || "",
      );
    }

    if (this.searchInInterfaces) {
      // Only interfaces this pup provides (not the ones it depends on).
      (version.interfaces || []).forEach((iface) => parts.push(iface?.name || ""));
    }

    return parts.join(" ").toLowerCase();
  }

}
