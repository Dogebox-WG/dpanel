
import { MOCK_PUP_LIST } from "./fixture.js";
import {
  LitElement,
  html,
  css,
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

import { store } from "/state/store.js";
import { pkgController } from "/controllers/package/index.js";

class CreateBackup extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding-bottom: 120px;
    }

    .tree-with-lines {
      --indent-guide-width: 1px;
    }

    .cap: {
      text-transform: capitalize;
    }

    .pup-list {
      display: flex;
      flex-direction: column;
    }

    .pup-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0.5rem 0.7rem 0.5rem;
      border-bottom: 1px solid #333;
    }

    .pup-main {
      min-width: 150px;
      overflow: hidden;
    }

    .pup-main sl-checkbox::part(label) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .pup-options {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-items: center;
      width: 200px;
      gap: 1rem;
    }

    .pup-header {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
      border-bottom: 2px solid #333;
      font-weight: bold;
      font-family: 'Comic Neue';
    }

    .options-header {
      display: flex;
      flex-direction: row;
      justify-content: center;
      gap: 1rem;
    }

    .option-label {
      width: 100px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      text-align: center;
    }

    .footer {
      display: flex;
      position: fixed;
      bottom: 0px;
      background: rgb(35, 37, 42);
      z-index: 1;
      align-items: center;
      flex-direction: row;
      justify-content: space-between;
      width: calc(100% - var(--page-margin-left));
      padding: 16px 20px 16px 20px;
      left: var(--page-margin-left);
      box-sizing: border-box;
      border-top: 1px solid #333;
    }
  `
  
  static properties = {
    _pups: { type: Array },
    _totalSize: { type: String },
  }

  constructor() {
    super();
    this._pups = [];
    this._systemSize = 1300000
    this._totalSize = this._systemSize;
    this.pkgController = pkgController;
  }

  connectedCallback() {
    super.connectedCallback();
    this.pkgController.addObserver(this);
  }

  disconnectedCallback() {
    this.pkgController.removeObserver(this);
    super.disconnectedCallback();
  }

  firstUpdated() {
    this.loadInstalledPups();
    this.hydrateFromBackupContext();
  }

  loadInstalledPups() {
    // load installed pups from pkgController
    const installedPups = this.pkgController.pups.filter(p => p.state);
    console.log("installed pups: ", installedPups);
    console.log("all pups: ", this.pkgController.pups);

    // Check if the data has actually changed
    const newPupNames = installedPups.map(pup => pup.state.manifest.meta.name).sort();
    const currentPupNames = this._pups.map(pup => pup.name).sort();
    
    if (JSON.stringify(newPupNames) === JSON.stringify(currentPupNames)) {
      console.log("Pup data hasn't changed, skipping update");
      return;
    }

    // Transform installed pups to the format expected by this component
    this._pups = installedPups.map(pup => {
      const pupName = pup.state.manifest.meta.name;
      
      // Find matching mock data for sizes
      const mockPup = MOCK_PUP_LIST.find(mock => mock.name === pupName);
      
      return {
        name: pupName,
        part: {
          application: { 
            bytes: mockPup?.part.application.bytes || "0",
            selected: false
          },
          storage: { 
            bytes: mockPup?.part.storage.bytes || "0",
            selected: false
          },
          cache: { 
            bytes: mockPup?.part.cache.bytes || "0",
            selected: false
          }
        }
      };
    });

    // Trigger re-render to show the pups
    this.requestUpdate();
  }

  hydrateFromBackupContext() {
    // hydrate from backup context
    const { pups } = store.getContext("backup")
    
    // Loop over each pup found in local storage backupContext
    Object.entries(pups).forEach(([pupName, scopes]) => {
    
      // Ensure to tick the pup's application checkbox.
      const applicationCheckbox = this.shadowRoot.querySelector(`sl-checkbox[data-pup="${pupName}"][data-part="application"]`);
      
      if (applicationCheckbox) {
        applicationCheckbox.checked = true;
      }

      // Then for each pup, tick storage and cache accordingly.
      ["storage", "cache"].forEach(scope => {
        if (scopes.includes(scope)) {
          const scopeCheckbox = this.shadowRoot.querySelector(`sl-checkbox[data-pup="${pupName}"][data-part="${scope}"]`);
          
          if (scopeCheckbox) {
            scopeCheckbox.checked = true;
          }
        }
      });
    });
  }

  updatePups() {
    // This method is called by pkgController when data is updated
    this.loadInstalledPups();
  }

  handleSelectAllClick() {
    const appCheckboxes = this.shadowRoot.querySelectorAll('sl-checkbox[data-part="application"]');
    const storageCheckboxes = this.shadowRoot.querySelectorAll('sl-checkbox[data-part="storage"]');
    const cacheCheckboxes = this.shadowRoot.querySelectorAll('sl-checkbox[data-part="cache"]');
    
    // Check if any application checkboxes are unchecked
    const hasUnchecked = Array.from(appCheckboxes).some(cb => !cb.checked);
    
    // If any are unchecked, check all. Otherwise uncheck all
    const newState = hasUnchecked;
    
    appCheckboxes.forEach(cb => cb.checked = newState);
    storageCheckboxes.forEach(cb => cb.checked = newState);
    cacheCheckboxes.forEach(cb => cb.checked = newState);

    this.calculateBackupSize();
    this.writeToContext();
  }

  handleProceedClick() {
    const payload = this.getCheckedItems();
    return payload;
  }

  handlePupCheckboxChange(e) {
    const storageCheckEl = this.shadowRoot.querySelector(`sl-checkbox[data-pup="${e.target.dataset.pup}"][data-part="storage"]`)
    const cacheCheckEl = this.shadowRoot.querySelector(`sl-checkbox[data-pup="${e.target.dataset.pup}"][data-part="cache"]`)

    // if pup is unchecked, ensure its parts become unchecked
    if (!e.target.checked) {
      storageCheckEl.checked = false;
      cacheCheckEl.checked = false;
    }

    // if pup is checked, ensure storage becomes checked.
    if (e.target.checked) {
      storageCheckEl.checked = true;
    }

    // trigger re-calc
    this.calculateBackupSize();

    // write to backup context
    this.writeToContext();
  }

  handlePartCheckboxChange(e) {
    // if a part is checked, ensure application is checked
    const pupCheckEl = this.shadowRoot.querySelector(`sl-checkbox[data-pup="${e.target.dataset.pup}"][data-part="application"]`);
    const pupAlreadyChecked = pupCheckEl.checked;

    if (e.target.checked && !pupAlreadyChecked) {
      const storageCheckEl = this.shadowRoot.querySelector(`sl-checkbox[data-pup="${e.target.dataset.pup}"][data-part="storage"]`)
      pupCheckEl.checked = true;
      storageCheckEl.checked = true;
    }

    // trigger re-calc
    this.calculateBackupSize();

    // write to backup context
    this.writeToContext();
  }
    
  calculateBackupSize() {
    const checkedItems = this.getCheckedItems();
    
    const sizeInBytes = Object.entries(checkedItems).reduce((total, [pupName, selectedParts]) => {
      const pup = this._pups.find(p => p.name === pupName);
      if (!pup) return total;
      
      const applicationBytes = parseInt(pup.part.application.bytes);
      const additionalBytes = selectedParts.reduce((sum, part) => 
        sum + parseInt(pup.part[part]?.bytes || 0), 0);
      
      return total + applicationBytes + additionalBytes;
    }, 0);

    this._totalSize = this._systemSize + sizeInBytes;
  }

  writeToContext() {
    store.updateState({ backupContext: {
      sizeInBytes: this._totalSize,
      pups: this.getCheckedItems()
    }});
  }

  getCheckedItems() {
    const result = {};
    
    this._pups.forEach(pup => {
      // Find the application checkbox for this pup
      const appCheckbox = this.shadowRoot.querySelector(`sl-checkbox[data-pup="${pup.name}"][data-part="application"]`);
      if (!appCheckbox?.checked) {
        return;
      }

      // Add pup to result object.
      result[pup.name] = []

      // Then identify if pups other parts are to be included.
      const selectedParts = [];
      
      // Check storage checkbox
      const storageCheckbox = this.shadowRoot.querySelector(`sl-checkbox[data-pup="${pup.name}"][data-part="storage"]`);
      if (storageCheckbox?.checked) {
        selectedParts.push('storage');
      }

      // Check cache checkbox
      const cacheCheckbox = this.shadowRoot.querySelector(`sl-checkbox[data-pup="${pup.name}"][data-part="cache"]`);
      if (cacheCheckbox?.checked) {
        selectedParts.push('cache');
      }

      if (selectedParts.length > 0) {
        result[pup.name] = selectedParts;
      }
    });

    return result;
  }
  
  render() {
    const GIGABYTE = 1000000000;
    const FIVE_GIGABYTES = GIGABYTE * 5;

    const getSizeVariant = (bytes) => {
      if (bytes > FIVE_GIGABYTES) return "danger";
      if (bytes > GIGABYTE) return "warning";
      return "neutral";
    }

    return html`
      <p>In nulla amet minim in elit et proident cillum ex excepteur pariatur quis commodo laboris laborum eiusmod do in dolor elit ut esse ullamco culpa et officia labore ut excepteur exercitation quis qui nostrud incididunt exercitation reprehenderit sed et.</p>

      <h3>Backup your System</h3>

      <sl-tree class="tree-with-lines" selection="multiple">
        <sl-tree-item expanded selected disabled>
          System <sl-tag size=small pill>1.3 MB</sl-tag>
          <sl-tree-item selected disabled>General Settings</sl-tree-item>
          <sl-tree-item selected disabled>Key derivation mapping</sl-tree-item> 
          <sl-tree-item selected disabled>Network (SSID, Password)</sl-tree-item>
          <sl-tree-item selected disabled>SSH keys</sl-tree-item>
        </sl-tree-item>
      </sl-tree>

     <h3>Backup your Pups</h3>

      <div class="pup-list">
        <div class="pup-header">
          <div class="first-header">
            Pup Name
            <sl-button @click=${this.handleSelectAllClick} size="small" variant="text">Toggle All</sl-button>
          </div>
          <div class="options-header">
            <div class="option-label">Storage
              <sl-tooltip content="Wow">
                <sl-icon-button name="question-circle" label="Storage Definition"></sl-icon-button>
              </sl-tooltip>
            </div>
            <div class="option-label">Cache
              <sl-tooltip content="Cow">
                <sl-icon-button name="question-circle" label="Storage Definition"></sl-icon-button>
              </sl-tooltip>
            </div>
          </div>
        </div>

        ${this._pups.map(pup => html`
        <div class="pup-row">
          <div class="pup-main">
            <sl-checkbox 
              data-pup="${pup.name}"
              data-part="application"
              ?checked=${pup.part.application.selected}
              @sl-change=${this.handlePupCheckboxChange}
            >
              ${pup.name}
              <sl-tag pill size="small" variant=${getSizeVariant(pup.part.application?.bytes)}>
                <sl-format-bytes value=${pup.part.application.bytes}></sl-format-bytes>
              </sl-tag>
            </sl-checkbox>
          </div>
          <div class="pup-options">
            <sl-checkbox
              data-pup="${pup.name}"
              data-part="storage"
              ?checked=${pup.part.storage?.selected}
              @sl-change=${this.handlePartCheckboxChange}
            >
              <sl-tag pill size="small" variant=${getSizeVariant(pup.part.storage?.bytes)}>
                <sl-format-bytes value=${pup.part.storage?.bytes}></sl-format-bytes>
              </sl-tag>
            </sl-checkbox>
            
            <sl-checkbox
              data-pup="${pup.name}"
              data-part="cache"
              ?checked=${pup.part.cache?.selected}
              @sl-change=${this.handlePartCheckboxChange}
            >
              <sl-tag pill size="small" variant=${getSizeVariant(pup.part.cache?.bytes)}>
                <sl-format-bytes value=${pup.part.cache?.bytes}></sl-format-bytes>
              </sl-tag>
            </sl-checkbox>
          </div>
        </div>
      `)}

      </div>

      <div class="footer">
        <div class="left">
          <span class="backup-size-label">Estiamted backup size:</span>
          <span class="backup-size-value">
            <sl-format-bytes value=${this._totalSize}></sl-format-bytes>
          </span>
        </div>
        <div class="right">
          <sl-button variant="primary" href="/settings/backup/target" @click=${this.handleProceedClick}>Next</sl-button>
        </div>
      </div>
    `
  }
}

customElements.define("x-action-backup", CreateBackup);
