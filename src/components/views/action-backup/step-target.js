
import {
  LitElement,
  html,
  css,
  nothing
} from "/vendor/@lit/all@3.1.2/lit-all.min.js";

import { asyncTimeout } from "/utils/timeout.js";

import { store } from "/state/store.js";

class SelectTarget extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding-bottom: 120px;
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

    sl-radio::part(base) {
      padding: 20px;
      box-sizing: border-box;
      border: 1px solid #444;
      width: 100%;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: .66em;
      margin: 0.5em 0em;
      border-radius: 8px;

      &:hover {
        border: 1px solid #555;
        cursor: pointer;
      }

      &.active {
        border: 1px solid var(--sl-color-primary-600);
      }

      &.active:hover {
        border: 1px solid var(--sl-color-primary-700);
      }
    }

    .details {
      display: flex;
      flex-direction: column;
      gap: .1rem;
      line-height: 1.2;
      max-width: 500px;

      .label {
        font-weight: bold;
        font-family: 'Comic Neue';
        font-size: 1.2rem;
      }

      .desc {}
    }

    .target-options-wrap {
      margin-top: 2em;
      display: flex;
      flex-direction: row;
      justify-content: center;
      gap: 2em;

      sl-radio-group {
        width: 100%;
      }
    }

    .title {
      text-align: left;
      width: 100%;
    }

    .folder-picker {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: .5em;
    }

    .disk-name {
      font-family: Comic Neue;
      font-size: 1rem;
    }

  `
  
  static properties = {
    _choice: { type: String },
    _totalSize: { type: String },
    _selected_disk: { type: String },
    _show_disk_pick_list: { type: Boolean },
    _selected_disk_adequate_size: { type: Boolean },
    _inflight_disk_fetch: { type: Boolean },
    _inflight_generate_backup: { type: Boolean },
    _show_encryption_modal: { type: Boolean },
    _backup_password: { type: String },
  }

  constructor() {
    super();
    this.choice = undefined;
    this._totalSize = store.getContext('backup').sizeInBytes;
    this._disks = [
      { name: "/diskA", size: "20000000000", sizePretty: "20 GB", suitability: { backup: { usable: true }}},
      { name: "/diskB", size: "300000000000", sizePretty: "300 GB", suitability: { backup: { usable: true }}}
    ]
    this._show_encryption_modal = false;
    this._backup_password = "";
  }

  firstUpdated() {
    const { sizeInBytes, deliveryMethod, selectedDisk } = store.getContext("backup");
    this._choice = deliveryMethod;
    this._totalSize = sizeInBytes;
    this._selected_disk = selectedDisk;
    
    // if theres a selected disk from local storage
    // compute other values, if not return.
    if (!selectedDisk) return
    
    const selectedDiskObj = this._disks.find((d) => this._selected_disk === d.name);
    if (!selectedDiskObj) return;

    try {
      if (parseInt(selectedDiskObj.size) > parseInt(this._totalSize)) {
        console.log(parseInt(selectedDiskObj.size), parseInt(this._totalSize));
        this._selected_disk_adequate_size = true;
      } else {
        this._selected_disk_adequate_size = false;
      }
    } catch (err) {
      console.error('Failed to check disk size', err)
    }
  }

  handleRadioChange(e) {
    this._choice = e.target.value;
    
    store.updateState({ backupContext: {
      deliveryMethod: e.target.value
    }});
  }

  handleDiskInputChange(e) {
    this._selected_disk = e.target.value;
    const selectedDiskObj = this._disks.find((d) => this._selected_disk === d.name);
    if (!selectedDiskObj) return;

    store.updateState({ backupContext: {
      selectedDisk: e.target.value
    }});

    try {
      if (parseInt(selectedDiskObj.size) > parseInt(this._totalSize)) {
        console.log(parseInt(selectedDiskObj.size), parseInt(this._totalSize));
        this._selected_disk_adequate_size = true;
      } else {
        this._selected_disk_adequate_size = false;
      }
    } catch (err) {
      console.error('Failed to check disk size', err)
    }
  }

  async handleDiskRefreshClick() {
    this._inflight_disk_fetch = true;
    await asyncTimeout(1200);
    this._inflight_disk_fetch = false;
  }

  async handleDiskSelect() {
    this._show_disk_pick_list = true;
    
    const selection = this._selected_disk;

    store.updateState({ backupContext: {
      selectedDisk: selection
    }});
  }

  handleProceedClick() {
    console.log('HERE');
    if (!this.canProceed()) return

    this._show_encryption_modal = true;
  }

  handlePasswordInput(e) {
    this._backup_password = e.target.value;
  }

  handleEncryptBackup() {
    this._show_encryption_modal = false;
    this._inflight_generate_backup = true;
    // TODO: Implement actual backup generation with encryption
    console.log('Generating encrypted backup with password:', this._backup_password);
  }

  handleProceedWithoutEncryption() {
    this._show_encryption_modal = false;
    this._inflight_generate_backup = true;
    // TODO: Implement actual backup generation without encryption
    console.log('Generating backup without encryption');
  }

  canProceed() {
    // No choice yet, cannot proceed
    if (!this._choice) {
      return false;
    }

    // Choice is download, can proceed
    if (this._choice === "download") {
      return true;
    }

    // Choice is disk. Needs selection and adequate capacity.
    // Additionally, cannot proceed if disk picker window is still open.
    if (this._choice === "disk" && this._selected_disk && this._selected_disk_adequate_size && !this._show_disk_pick_list) {
      return true;
    }
  }
  
  render() {
    const GIGABYTE = 1000000000;
    const FIVE_GIGABYTES = GIGABYTE * 5;

    const getSizeVariant = (bytes) => {
      if (bytes > FIVE_GIGABYTES) return "danger";
      if (bytes > GIGABYTE) return "warning";
      return "neutral";
    }

    const renderDiskName = () => {
      if (this.canProceed()) {
        const selectedDiskObj = this._disks.find((d) => this._selected_disk === d.name);
        if (!selectedDiskObj) return;
        return html`
          <span class="disk-name">
            ${selectedDiskObj.name} (${selectedDiskObj.sizePretty})
          </span>
          <sl-icon name="check-circle-fill" style="color: var(--sl-color-success-600)"></sl-icon>
        `
      }
    }

    return html`
      <sl-alert open>
        <sl-icon slot="icon" name="info-circle"></sl-icon>
        There's two ways to save your backup.<br>Large backups (over 1GB) are best written direct to disk
      </sl-alert>

      <div class="target-options-wrap">
          <sl-radio-group 
            label="Select your backup delivery method" 
            name="delivery" 
            value=${this._choice}
            @sl-change=${this.handleRadioChange}
          >
            <sl-radio value="download">
              <div class="details">
                <span class="label">Download in Browser</span>
                <small class="desc">Deserunt ex eiusmod mollit ullamco elit incididunt aliquip anim reprehenderit aliqua.</small>
              </div>
            </sl-radio>
            
            <sl-radio value="disk">
              <div class="details">
                <span class="label">Save to disk</span>
                <small class="desc">Deserunt ex eiusmod mollit ullamco elit incididunt aliquip anim reprehenderit aliqua.</small>
              </div>
            </sl-radio>
          </sl-radio-group>
      </div>

      ${this._choice === "disk" ? html`
        <div class="folder-picker">
          <sl-button variant="default" @click=${this.handleDiskSelect}>
            <sl-icon slot="prefix" name="folder"></sl-icon>
            Select Disk
          </sl-button>
          ${renderDiskName()}
        </div>
      ` : nothing}

      <sl-dialog ?open=${this._show_disk_pick_list} label="Insert media" @sl-request-close=${() => this._show_disk_pick_list = false}>

        <div class="form-control">
          <sl-select
            required
            label="Select destination"
            help-text="Select a disk with enough capacity"
            placeholder="Pick from dropdown"
            data-field="disk"
            value=${this._selected_disk}
            @sl-change=${this.handleDiskInputChange}
            hoist
          >
            ${this._disks
              .filter((disk) => disk?.suitability?.backup?.usable)
              .map((disk) =>
                html`
                  <sl-option value=${disk.name}>${disk.name} (${disk.sizePretty})</sl-option>
                `,
            )}
          </sl-select>
        </div>

        <sl-alert variant="warning" ?open=${this._selected_disk && !this._selected_disk_adequate_size} style="margin-top: 1em">
          <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
          The selected disk is too small.
        </sl-alert>

        <div slot="footer">
          <sl-button variant="text" ?loading=${this._inflight_disk_fetch} @click=${this.handleDiskRefreshClick}>Refresh list</sl-button>
          <sl-button variant="primary" ?disabled=${!this._selected_disk || !this._selected_disk_adequate_size} @click=${() => this._show_disk_pick_list = false}>Done</sl-button>
        </div>
      </sl-dialog>

      <sl-dialog ?open=${this._show_encryption_modal} label="Do you want to encrypt this backup?" @sl-request-close=${() => this._show_encryption_modal = false}>
        <p style="margin-bottom: 0.5em; line-height: 1.5;">
          Set a password for this backup file
        </p>
        
        <div class="form-control">
          <sl-input
            type="password"
            placeholder="Enter password for encryption"
            value=${this._backup_password}
            @sl-input=${this.handlePasswordInput}
            required
          ></sl-input>
        </div>

        <div slot="footer">
          <sl-button variant="text" @click=${this.handleProceedWithoutEncryption}>
            Proceed without encryption
          </sl-button>
          <sl-button variant="primary" ?disabled=${!this._backup_password} @click=${this.handleEncryptBackup}>
            Yes, Encrypt
          </sl-button>
        </div>
      </sl-dialog>

      <div class="footer">
        <div class="left">
          <span class="backup-size-label">Estimated backup size:</span>
          <span class="backup-size-value">
            <sl-format-bytes value=${this._totalSize}></sl-format-bytes>
          </span>
        </div>
        <div class="right">
          <sl-button
            variant="success"
            ?outline=${!this.canProceed()}
            ?disabled=${!this.canProceed()}
            ?loading=${this._inflight_generate_backup}
            @click=${this.handleProceedClick}>
              Generate Backup
          </sl-button>
        </div>
      </div>
    `
  }
}

customElements.define("x-action-backup-select-target", SelectTarget);
