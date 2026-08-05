import { html, css, nothing, guard } from '/lib/lit-all.js';
import type { PupSnapshot } from '../index.js';

export function renderSectionConfig(this: PupSnapshot) {
  const isActiveTab = this.activeTab === 'config';
  const hasConfig = this.config &&
    this.config.sections &&
    this.config.sections.length
  return html`
    <sl-tab slot="nav" panel="config">Config</sl-tab>
    <sl-tab-panel name="config">
      ${!hasConfig ? html`
         <div class="empty">
          Such empty.  Nothing to configure here.
        </div>
      `: nothing }

      ${isActiveTab && hasConfig ? html`
        ${guard([this.options, this.config], () => html`
          <de-form
            .values=${this.options}
            .fields=${this.config}
            .onSubmit=${this.submitConfig}
            requireCommit
            markModifiedFields
            allowDiscardChanges
          >
          </de-form>
        `)}
      ` : nothing }
    </sl-tab-panel>
    <style>${emptyConfigStyles}</style>
  `
}

const emptyConfigStyles = css`
  .empty {
    width: 100%;
    color: var(--sl-color-neutral-600);
    box-sizing: border-box;
    border: dashed 1px var(--sl-color-neutral-200);
    border-radius: var(--sl-border-radius-medium);
    padding: var(--sl-spacing-x-large) var(--sl-spacing-medium);
  }
`
