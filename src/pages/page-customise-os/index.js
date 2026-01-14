import { LitElement, html, css, nothing } from '/vendor/@lit/all@3.1.2/lit-all.min.js';
import { getCustomNix, saveCustomNix, validateCustomNix } from '/api/system/custom-nix.js';
import { createAlert } from '/components/common/alert.js';

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
      height: calc(100vh - 80px);
      overflow: hidden;
    }

    .container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2em;
      padding: 0.75em 1em;
      background: rgba(0,0,0,0.3);
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    .banner-left {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .banner-subtitle {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.5);
      font-family: "Comic Neue", sans-serif;
    }

    .banner-warning {
      font-size: 0.75rem;
      color: #f59e0b;
      font-family: "Comic Neue", sans-serif;
      margin-top: 0.25em;
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
      background: rgba(0,0,0,0.2);
      min-height: 0;
    }

    .editor-wrapper {
      flex: 1;
      position: relative;
      min-height: 0;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      overflow: hidden;
    }

    .editor-wrapper:focus-within {
      border-color: rgba(255,255,255,0.25);
    }

    .editor-highlight,
    .editor {
      font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace;
      font-size: 0.9rem;
      line-height: 1.5;
      padding: 1em;
      margin: 0;
      border: none;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .editor-highlight {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.4);
      color: rgba(255,255,255,0.85);
      pointer-events: none;
      overflow: auto;
    }

    .editor {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      color: transparent;
      caret-color: white;
      resize: none;
      outline: none;
      box-sizing: border-box;
      overflow: auto;
    }

    /* Syntax highlighting colors */
    .hl-comment { color: rgba(255,255,255,0.35); }
    .hl-string { color: #98c379; }
    .hl-keyword { color: #c678dd; }
    .hl-boolean { color: #d19a66; }
    .hl-bracket { color: #e5c07b; }
    .hl-attribute { color: #61afef; }
    .hl-operator { color: #56b6c2; }

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

  updated(changedProperties) {
    super.updated(changedProperties);
    // Update the highlighted content directly via innerHTML
    const highlight = this.shadowRoot?.querySelector('.editor-highlight');
    if (highlight) {
      highlight.innerHTML = this.highlightNix(this._content);
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
    this.syncScroll(e.target);
    this.scheduleValidation();
  }

  handleScroll(e) {
    this.syncScroll(e.target);
  }

  syncScroll(textarea) {
    const highlight = this.shadowRoot.querySelector('.editor-highlight');
    if (highlight) {
      highlight.scrollTop = textarea.scrollTop;
      highlight.scrollLeft = textarea.scrollLeft;
    }
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

  get warningsDismissed() {
    const trimmed = this._content?.trimStart();
    return trimmed?.startsWith('#i-know-what-im-doing\n') || trimmed?.startsWith('#i-know-what-im-doing\r\n');
  }

  async handleSave() {
    if (!this.canSave || this._saving) return;

    this._saving = true;
    try {
      const res = await saveCustomNix(this._content);
      
      // Check if response indicates an error
      if (res.error) {
        throw new Error(res.error);
      }
      
      createAlert('success', 'Configuration saved. System rebuild in progress...');
      
      // Update original content since we saved
      this._originalContent = this._content;
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

  highlightNix(code) {
    // Use placeholder tokens to avoid regex collisions
    const TOKENS = {
      SPAN_OPEN: '\u0001',
      SPAN_CLOSE: '\u0002',
      QUOTE: '\u0003',
    };
    
    const span = (cls, content) => `${TOKENS.SPAN_OPEN}${cls}${TOKENS.SPAN_CLOSE}${content}${TOKENS.SPAN_OPEN}/${TOKENS.SPAN_CLOSE}`;
    
    // Escape HTML first
    let escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Process line by line to handle comments properly
    const lines = escaped.split('\n');
    const highlighted = lines.map(line => {
      // Check if line is a comment (starts with # after optional whitespace)
      if (/^\s*#/.test(line)) {
        return span('hl-comment', line);
      }
      
      let result = line;
      
      // Strings (double quotes) - protect quotes first
      result = result.replace(/"([^"\\]|\\.)*"/g, match => span('hl-string', match));
      
      // Keywords
      result = result.replace(/\b(if|then|else|let|in|with|inherit|rec|import|assert|or)\b/g, 
        match => span('hl-keyword', match));
      
      // Booleans and null
      result = result.replace(/\b(true|false|null)\b/g, match => span('hl-boolean', match));
      
      // Attribute names (dotted path followed by optional space and =)
      result = result.replace(/\b([a-zA-Z_][a-zA-Z0-9_.-]*)\s*(?==)/g, 
        match => span('hl-attribute', match));
      
      // Brackets, braces, parens
      result = result.replace(/([{}\[\]()])/g, match => span('hl-bracket', match));
      
      // Operators (but not = inside our tokens)
      result = result.replace(/(=&gt;|==|!=|&lt;=|&gt;=|\+\+|\/\/)/g, match => span('hl-operator', match));
      result = result.replace(/([=;:])/g, match => span('hl-operator', match));
      
      return result;
    });
    
    // Convert tokens to actual HTML
    let html = highlighted.join('\n') + '\n';
    html = html.replace(new RegExp(`${TOKENS.SPAN_OPEN}([^${TOKENS.SPAN_CLOSE}]+)${TOKENS.SPAN_CLOSE}`, 'g'), '<span class="$1">');
    html = html.replace(new RegExp(`${TOKENS.SPAN_OPEN}/${TOKENS.SPAN_CLOSE}`, 'g'), '</span>');
    
    return html;
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
            <div class="banner-subtitle">Edit your custom NixOS configuration below</div>
            ${!this.warningsDismissed ? html`
              <div class="banner-warning">⚠️ Warning: Invalid configuration may prevent your system from booting - If you break something, edit /etc/nixos/dogebox/custom.nix manually via ssh</div>
              <div class="banner-warning">Is someone asking you to edit this file? They are probably trying to scam you</div>
              <div class="banner-warning">To dismiss this warning, add #i-know-what-im-doing to the beginning of the file</div>
            ` : nothing}
          </div>
          <div class="banner-right">
            ${this.renderValidationStatus()}
            <sl-button 
              variant="primary" 
              size="small"
              ?disabled=${!this.canSave}
              ?loading=${this._saving}
              @click=${this.handleSave}
            >
              Save & Rebuild
            </sl-button>
          </div>
        </div>
        
        <div class="editor-container">
          <div class="editor-wrapper">
            <pre class="editor-highlight"></pre>
            <textarea 
              class="editor"
              .value=${this._content}
              @input=${this.handleContentChange}
              @scroll=${this.handleScroll}
              @keydown=${this.handleKeyDown}
              spellcheck="false"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
            ></textarea>
          </div>
          
          ${this._validationError ? html`
            <div class="error-display">${this._validationError}</div>
          ` : nothing}
        </div>
      </div>

    `;
  }
}

customElements.define('x-page-customise-os', PageCustomiseOS);
