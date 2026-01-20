import { LitElement, html, css, nothing } from "/vendor/@lit/all@3.1.2/lit-all.min.js";

import { asyncTimeout } from "/utils/timeout.js";
import { createAlert } from "/components/common/alert.js";
import { getKeymaps, setKeymap } from "/api/system/keymaps.js";
import { getTimezones, setTimezone } from "/api/system/timezones.js";
import { getDisks, setStorageDisk } from "/api/disks/disks.js";
import { setHostname } from "/api/system/hostname.js";
import { formatTimezoneWithOffset, sortTimezonesByCity } from "/utils/timezone-formatter.js";

// Render chunks
import { renderBanner } from "./banner.js";

// Store
import { store } from "/state/store.js";

// Components and styles
import { toggledSectionStyles } from "/components/common/toggled-section.js";

class SystemSettings extends LitElement {
  static styles = [toggledSectionStyles, css`
    :host {
      display: block;
    }
    .page {
      display: flex;
      align-self: center;
      justify-content: center;
      padding-bottom: 1em;
    }
    .padded {
      width: 100%;
      margin: 0em 0em;
    }
    h1 {
      font-family: "Comic Neue", sans-serif;
    }

    .form-control {
      position: relative;
      margin-bottom: 1em;
    }

    .form-control .label-button {
      position: absolute;
      right: -16px;
      top: -6px;
    }

    .action-wrap {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
      gap: 1em;
      margin-bottom: 2em;
    }

    h4 { margin: 0.5em 0; display: flex; align-items: center; }

    .next-button {
      margin-top: 2em;
    }
  `];

  static get properties() {
    return {
      _loading: { type: Boolean },
      _inflight: { type: Boolean },
      _keymaps: { type: Array },
      _timezones: { type: Array },
      _disks: { type: Array },
      _changes: { type: Object },
      _show_disk_size_warning: { type: Boolean },
      _show_disk_in_use_warning: { type: Boolean },
      _is_boot_media: { type: Boolean },
      _confirmation_checked: { type: Boolean },
    };
  }

  constructor() {
    super();
    this._keymaps = [];
    this._timezones = [];
    this._disks = [];
    this._changes = {
      keymap: 'us',
      disk: '',
      'device-name': '',
      use_fdn_pup_binary_cache: true,
      use_fdn_os_binary_cache: true,
    };
    this._show_disk_size_warning = false;
    this._show_disk_size_in_use_warning = false;
    this._is_boot_media = false;
    this._confirmation_checked = false;
  }

  async connectedCallback() {
    super.connectedCallback();
  }

  async firstUpdated() {
    window.scrollTo({ top: 0 });
    await this._fetch();
    this._generateName();
  }

  async _fetch() {
    try {
      this._loading = true;
      this._keymaps = await getKeymaps();
      const rawTimezones = await getTimezones();
      
      // Transform and sort timezones
      const formattedTimezones = rawTimezones.map(tz => formatTimezoneWithOffset(tz));
      this._timezones = sortTimezonesByCity(formattedTimezones);
      
      this._disks = await getDisks();

      // Set default disk as the "bootMedia" disk.
      const bootMediaDisk = this._disks.find((disk) => disk.bootMedia)
      if (!bootMediaDisk) {
        console.warn('No boot media disk detected, this is funky.')
        createAlert('warning', ['Boot media disk not detected', 'Please raise on Discord'])
        return;
      }
      if (bootMediaDisk) {
        this._changes.disk = bootMediaDisk.name
        this._checkDiskFlags({ diskName: bootMediaDisk.name });
      }

    } catch (e) {
      console.error(e.toString());
    } finally {
      this._loading = false;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  async _attemptSubmit() {
    this._inflight = true;

    // Only input elements that have a name attribute are sent to backend.
    const formFields = this.shadowRoot.querySelectorAll('sl-input[name], sl-select[name], sl-checkbox[name]');
    const hasInvalidField = Array.from(formFields).some(field => field.hasAttribute('data-invalid'));

    await asyncTimeout(2000);

    if (hasInvalidField) {
      createAlert('warning', 'Uh oh, invalid data detected.');
      this._inflight = false;
      return;
    }

    let didSucceed = false

    store.updateState({
      setupContext: {
        useFoundationPupBinaryCache: this._changes.use_fdn_pup_binary_cache,
        useFoundationOSBinaryCache: this._changes.use_fdn_os_binary_cache,
      },
    });

    try {
      await setHostname({ hostname: this._changes['device-name'] });
      await setKeymap({ keymap: this._changes.keymap });
      await setTimezone({ timezone: this._changes.timezone });
      await setStorageDisk({ storageDevice: this._changes.disk });
      didSucceed = true;
    } catch (err) {
      console.error('Error occurred when saving config during setup', err);
      createAlert('danger', ['Failed to save config', 'Please refresh and try again'])
    } finally {
      this._inflight = false;
      if (didSucceed) {
        await this.onSuccess(); 
      }
    }
  }

  _generateName() {
    const rando = Math.round(Math.random() * 1000);
    this._changes["device-name"] = `my-dogebox-${rando}`;
    this.requestUpdate();
  }

  _handleInputChange(e) {
    const field = e.target.getAttribute("data-field");
    this._changes[field] = e.target.value;
    
    // Disk selection requires additional validation
    if (field === 'disk') {
      this._checkDiskFlags({ diskName: e.target.value });
    }
  }

  _handleTimezoneChange(e) {
    this._changes.timezone = e.target.value;
  }

  _checkDiskFlags({ diskName }) {
    // if not a "suitableDataDisk" display a warning to the user.
    const diskObject = this._disks.find((d) => d.name === diskName);
    if (!diskObject) { 
      console.warn('Could not find details of selected disk')
      return;
    }

    this._is_boot_media = diskObject.bootMedia;
    this._show_disk_size_warning = !diskObject?.suitability?.storage?.sizeOK;
    this._show_disk_in_use_warning = diskObject?.suitability?.isAlreadyUsed;
  }

  _getBinaryCacheAlertVariant() {
    return this._changes.use_fdn_pup_binary_cache && this._changes.use_fdn_os_binary_cache ? 'primary' : 'warning';
  }

  _getBinaryCacheAlertIcon() {
    return this._changes.use_fdn_pup_binary_cache && this._changes.use_fdn_os_binary_cache ? 'info-circle' : 'exclamation-triangle';
  }

  _getBinaryCacheAlertMessage() {
    if (this._changes.use_fdn_pup_binary_cache && this._changes.use_fdn_os_binary_cache) {
      return 'Using a binary cache saves time. Binaries are still validated for authenticity before installation.';
    }

    const disabledCaches = [];
    if (!this._changes.use_fdn_pup_binary_cache) disabledCaches.push('Pup');
    if (!this._changes.use_fdn_os_binary_cache) disabledCaches.push('OS');
    
    return `Just a heads up. You may experience longer ${disabledCaches.join(' and ')} install times down the track (up to 30 minutes in some cases)`;
  }

  handleCheckboxChange(e) {
    this._confirmation_checked = e.target.checked;
  }

  render() {
    if (this._loading) {
      return html`<sl-spinner></sl-spinner>`;
    }
    return html`
      <div class="page">
        <div class="padded">

          ${renderBanner()}

          <div class="form-control">
            <sl-button class="label-button" variant="text" @click=${this._generateName}>Randomize</sl-button>
            <sl-input
              name="device-name"
              required
              label="Set Device Name (for your local network)"
              ?disabled=${this._inflight}
              pattern="^$|^[a-zA-Z0-9]([a-zA-Z0-9_\\-]{0,61}[a-zA-Z0-9])?$"
              help-text="Allows alpha/numeric segments separated by, underscore, hypen and period. Cannot start or end in special characters."
              data-field="device-name"
              value=${this._changes['device-name']}
              @sl-input=${this._handleInputChange}
            ></sl-input>
          </div>

          <div class="form-control">
            <sl-select
              name="keymap"
              required
              label="Select Keyboard Layout" 
              ?disabled=${this._inflight}
              data-field="keymap"
              value=${this._changes.keymap}
              help-text="For if/when you plug in a physical keyboard"
              @sl-change=${this._handleInputChange}
            >
              ${this._keymaps.map(
                (keymap) =>
                  html`<sl-option value=${keymap.id}
                    >${keymap.label} ${!keymap.label.includes(keymap.id.toUpperCase()) ? `(${keymap.id.toUpperCase()})` : ''}</sl-option
                  >`,
              )}
            </sl-select>
          </div>

          <div class="form-control">
            <sl-select
              name="timezone"
              required
              label="Select Timezone"
              help-text="Where in the world should your clock be set to"
              value=${this._changes.timezone || ''}
              ?disabled=${this._inflight}
              @sl-change=${this._handleTimezoneChange}
              hoist
            >
              ${this._timezones.map(
                (timezone) =>
                  html`<sl-option value=${timezone.id}>
                    ${timezone.displayLabel}
                  </sl-option>`
              )}
            </sl-select>
          </div>

          <div class="form-control">
            <sl-select
              name="disk"
              required
              label="Select Mass Storage Disk"
              ?disabled=${this._inflight}
              help-text="To sync the Dogecoin Blockchain, a disk with >300GB capacity is required"
              data-field="disk"
              value=${this._changes.disk}
              @sl-change=${this._handleInputChange}
            >
              ${this._disks
                .filter((disk) => disk?.suitability?.storage?.usable)
                .map((disk) =>
                  html`
                    <sl-option value=${disk.name}>${disk.name} (${disk.sizePretty}) ${disk.bootMedia ? "[Running Dogebox OS]" : ""}</sl-option>
                  `,
              )}
            </sl-select>

            <sl-alert variant="primary" ?open=${this._show_disk_size_warning} style="margin: 1em 0em;">
              <sl-icon slot="icon" name="info-circle"></sl-icon>
              You have selected a disk with less than 300GB capacity.  You can proceed, however syncing the Blockchain could exhaust your disk.
            </sl-alert>
          </div>

          <sl-details class="advanced" summary="Advanced Settings">
            <h4>Binary Caches
              <sl-tooltip>
                <div slot="content">
                  A binary cache stores pre-compiled packages to speed up installation and reduce build time. Instead of compiling everything from source code, the system can download ready-to-use binaries from the Dogecoin Foundation's cache: https://nix.dogecoin.org/
                  </div>
                <sl-icon-button name="question-circle" label="Binary cache explaination"></sl-icon-button></h4>
              </sl-tooltip>
            <div class="form-control">
              <sl-checkbox
                name="use_fdn_os_binary_cache"
                ?checked=${this._changes.use_fdn_os_binary_cache}
                .value=${this._changes.use_fdn_os_binary_cache}
                @sl-change=${(e) => { this._changes.use_fdn_os_binary_cache = e.target.checked; this.requestUpdate(); }}
                help-text="Uncheck to opt out of using the Dogecoin Foundation OS binary cache">
                Use Dogecoin FDN OS binary cache
              </sl-checkbox>
              <sl-checkbox
                name="use_fdn_pup_binary_cache"
                ?checked=${this._changes.use_fdn_pup_binary_cache}
                .value=${this._changes.use_fdn_pup_binary_cache}
                @sl-change=${(e) => { this._changes.use_fdn_pup_binary_cache = e.target.checked; this.requestUpdate(); }}
                help-text="Uncheck to opt out of using the Dogecoin Foundation Pup binary cache">
                Use Dogecoin FDN Pup binary cache
              </sl-checkbox>
            </div>

            <sl-alert 
              variant=${this._getBinaryCacheAlertVariant()}
              open
              style="margin-top: 1em;"
            >
              <sl-icon slot="icon" name=${this._getBinaryCacheAlertIcon()}></sl-icon>
              ${this._getBinaryCacheAlertMessage()}
            </sl-alert>

          </sl-details>

          <sl-divider style="--spacing: 2rem;"></sl-divider>

          <sl-alert variant="warning" ?open=${this._changes.disk && !this._is_boot_media} style="margin: 1em 0em;">
            <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
            ${this._show_disk_in_use_warning
              ? html`Warning. The selected disk appears to have data present. The contents of this disk <strong>(${this._changes.disk})</strong> will be erased to prepare it for use as a mass storage drive for your Dogebox.`
              : html`Warning. The contents of disk <strong>${this._changes.disk}</strong> will be erased to prepare it for use as a mass storage drive for your Dogebox.`
            }
          </sl-alert>

          <div class="action-wrap">
            ${this._changes.disk && !this._is_boot_media ? html`
              <sl-checkbox @sl-change=${this.handleCheckboxChange}>I understand</sl-checkbox>
              `: nothing 
            }

            <sl-button
              class="next-button"
              variant="primary"
              ?disabled=${this._inflight || (this._changes.disk && !this._is_boot_media && !this._confirmation_checked)}
              ?loading=${this._inflight}
              @click=${this._attemptSubmit}
              >Next</sl-button
            >
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("x-action-system-settings", SystemSettings);
