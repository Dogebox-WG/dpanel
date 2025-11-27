import { LitElement, html, css, nothing } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import { getCustomNix, saveCustomNix, validateCustomNix } from '/api/system/custom-nix.js';
import { createAlert } from '/components/common/alert.js';
import { getRouter } from '/router/index.js';

class PageCustomiseOS extends LitElement {
  static get properties() {
    return {
      _loading: { type: Boolean },
      _saving: { type: Boolean },
      _content: { type: String },
      _originalContent: { type: String },
      _isValid: { type: Boolean },
      _validationError: { type: String },
      _validating: { type: Boolean },
      _exists: { type: Boolean },
    };
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
      background: var(--sl-color-neutral-50);
    }

    .container {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-height: 100vh;
    }

    .banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75em 1em;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .banner-left {
      display: flex;
      align-items: center;
      gap: 0.75em;
    }

    .banner-left sl-icon {
      font-size: 1.5rem;
      color: var(--sl-color-primary-400);
    }

    .banner-title {
      font-family: "Comic Neue", sans-serif;
      font-size: 1.1rem;
      font-weight: 600;
      color: white;
    }

    .banner-subtitle {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.6);
    }

    .banner-right {
      display: flex;
      align-items: center;
      gap: 1em;
    }

    .validation-status {
      display: flex;
      align-items: center;
      gap: 0.5em;
      padding: 0.35em 0.75em;
      border-radius: 4px;
      font-size: 0.8rem;
    }

    .validation-status.valid {
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
    }

    .validation-status.invalid {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }

    .validation-status.validating {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255,255,255,0.7);
    }

    .validation-status sl-icon {
      font-size: 1rem;
    }

    .editor-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 1em;
      background: #0d1117;
    }

    .editor {
      flex: 1;
      width: 100%;
      font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace;
      font-size: 0.9rem;
      line-height: 1.5;
      background: #161b22;
      color: #c9d1d9;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 1em;
      resize: none;
      tab-size: 2;
    }

    .editor:focus {
      outline: none;
      border-color: var(--sl-color-primary-500);
      box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.2);
    }

    .error-display {
      margin-top: 0.5em;
      padding: 0.75em 1em;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 6px;
      color: #f87171;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      white-space: pre-wrap;
      max-height: 150px;
      overflow-y: auto;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    .saving-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      gap: 1em;
    }

    .saving-overlay span {
      color: white;
      font-family: "Comic Neue", sans-serif;
      font-size: 1.1rem;
    }
  `;

  constructor() {
    super();
    this._loading = true;
    this._saving = false;
    this._content = '';
    this._originalContent = '';
    this._isValid = true;
    this._validationError = '';
    this._validating = false;
    this._exists = false;
    this._validationTimeout = null;
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadContent();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._validationTimeout) {
      clearTimeout(this._validationTimeout);
    }
  }

  async loadContent() {
    this._loading = true;
    try {
      const res = await getCustomNix();
      this._content = res.content;
      this._originalContent = res.content;
      this._exists = res.exists;
      this._isValid = true;
    } catch (err) {
      createAlert('danger', 'Failed to load custom configuration');
      console.error('Failed to load custom nix:', err);
    } finally {
      this._loading = false;
    }
  }

  handleContentChange(e) {
    this._content = e.target.value;
    this.scheduleValidation();
  }

  scheduleValidation() {
    // Debounce validation
    if (this._validationTimeout) {
      clearTimeout(this._validationTimeout);
    }
    this._validating = true;
    this._validationTimeout = setTimeout(() => this.validateContent(), 500);
  }

  async validateContent() {
    try {
      const res = await validateCustomNix(this._content);
      this._isValid = res.valid;
      this._validationError = res.error || '';
    } catch (err) {
      this._isValid = false;
      this._validationError = 'Validation request failed';
      console.error('Validation error:', err);
    } finally {
      this._validating = false;
    }
  }

  get hasChanges() {
    return this._content !== this._originalContent;
  }

  get canSave() {
    return this.hasChanges && this._isValid && !this._validating && !this._saving;
  }

  async handleSave() {
    if (!this.canSave) return;

    this._saving = true;
    try {
      const res = await saveCustomNix(this._content);
      // The save triggers a rebuild job - wait for it
      createAlert('success', 'Configuration saved. System rebuild in progress...');
      
      // Update original content since we saved
      this._originalContent = this._content;
      
      // Redirect to activity page to monitor the rebuild
      const router = getRouter();
      router.navigate('/activity');
    } catch (err) {
      createAlert('danger', 'Failed to save configuration');
      console.error('Save error:', err);
    } finally {
      this._saving = false;
    }
  }

  handleKeyDown(e) {
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Insert 2 spaces
      textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      
      // Trigger input event to update state
      this._content = textarea.value;
      this.scheduleValidation();
    }
  }

  renderValidationStatus() {
    if (this._validating) {
      return html`
        <div class="validation-status validating">
          <sl-spinner style="--indicator-color: currentColor; --track-width: 2px; font-size: 0.9rem;"></sl-spinner>
          <span>Validating...</span>
        </div>
      `;
    }

    if (this._isValid) {
      return html`
        <div class="validation-status valid">
          <sl-icon name="check-circle-fill"></sl-icon>
          <span>Valid</span>
        </div>
      `;
    }

    return html`
      <div class="validation-status invalid">
        <sl-icon name="x-circle-fill"></sl-icon>
        <span>Invalid</span>
      </div>
    `;
  }

  render() {
    if (this._loading) {
      return html`
        <div class="loading-container">
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>
      `;
    }

    return html`
      <div class="container">
        <div class="banner">
          <div class="banner-left">
            <sl-icon name="code-slash"></sl-icon>
            <div>
              <div class="banner-title">Custom OS Configuration</div>
              <div class="banner-subtitle">Edit your custom NixOS configuration below</div>
            </div>
          </div>
          <div class="banner-right">
            ${this.renderValidationStatus()}
            <sl-button 
              variant="primary" 
              size="small"
              ?disabled=${!this.canSave}
              @click=${this.handleSave}
            >
              <sl-icon slot="prefix" name="save"></sl-icon>
              Save & Rebuild
            </sl-button>
          </div>
        </div>
        
        <div class="editor-container">
          <textarea 
            class="editor"
            .value=${this._content}
            @input=${this.handleContentChange}
            @keydown=${this.handleKeyDown}
            spellcheck="false"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
          ></textarea>
          
          ${this._validationError ? html`
            <div class="error-display">${this._validationError}</div>
          ` : nothing}
        </div>
      </div>

      ${this._saving ? html`
        <div class="saving-overlay">
          <sl-spinner style="font-size: 3rem; --indicator-color: white;"></sl-spinner>
          <span>Saving and rebuilding system...</span>
        </div>
      ` : nothing}
    `;
  }
}

customElements.define('x-page-customise-os', PageCustomiseOS);

