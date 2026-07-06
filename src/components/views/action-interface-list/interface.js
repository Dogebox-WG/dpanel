import { LitElement, html, css, nothing } from "/lib/lit-all.js";
import "/components/common/action-row/action-row.js";

export class InterfaceList extends LitElement {
  static get properties() {
    return {
      interfaces: { type: Array },
      expandedInterface: { type: String }
    };
  }

  constructor() {
    super();
    this.expandedInterface = null;
    this.interfaces = [];
  }

  handleExpand(interfaceName) {
    this.expandedInterface = this.expandedInterface === interfaceName ? null : interfaceName;
    this.requestUpdate();
  }

  render() {
    if (!this.interfaces || !this.interfaces.length) {
      return;
    }

    const renderSeverityOptions = (severityNumber) => {
      if (!severityNumber || severityNumber < 1 || severityNumber > 3) {
        return html`<div class="sev-options">
          ${severityNumber}
          <span class="unknown">Unknown</span>
        </div>`;
      }

      return html`
        <div class="sev-options">
          <span class="low ${severityNumber === 1 ? "selected" : ""}">Mild</span>
          <span class="medium ${severityNumber === 2 ? "selected" : ""}">Medium</span>
          <span class="high ${severityNumber === 3 ? "selected" : ""}">Spicy</span>
        </div>
      `;
    };

    const renderPermissionGroup = (group) => {
      const routeCount = group?.routes?.length || 0;
      const routeLabel = routeCount === 1 ? "Route" : "Routes";

      return html`
        <sl-card class="permission-group">
          <div slot="header" class="permission-name">
            <span class="label">Permission name</span>
            <span class="value">${group.name}</span>
          </div>
          <div class="description">
            <span class="label">Permission description</span>
            <span class="value">${group.description}</span>
          </div>
          ${group.routes && group.routes.length ? html`
            <sl-divider></sl-divider>
            <div class="routes">
              <div class="label">${routeCount} ${routeLabel}:</div>
              <div class="value">${group.routes.map((r) => html`${r}`)}</div>
            </div>`: nothing
          }
          <sl-divider></sl-divider>
          <div class="severity">
            <span class="label">Severity:</span>
            ${renderSeverityOptions(group.severity)}
          </div>
        </sl-card>
      `;
    };

    return html`
      <div>

        ${this.interfaces && this.interfaces.length === 0 ? html`
          <div class="empty">
            Such empty.<br>
            This pup implements zero interfaces.  That's fine.
          </div>
        ` : nothing }

        ${this.interfaces.map(
          (iface) => html`
            <action-row label="${iface.name}" prefix="layers" expandable ?expand=${this.expandedInterface === iface.name} @row-expand=${() => this.handleExpand(iface.name)}>
              <span>Version: ${iface.version}</span>
              <div class="interface-details" slot="hidden" id="details-${iface.name}">
                ${iface.permissionGroups.length > 0
                  ? html`
                      <div class="details-group">
                        ${iface.permissionGroups.map((group) => renderPermissionGroup(group))}
                      </div>
                    `
                  : html`<p>No permission groups available.</p>`}
              </div>
            </action-row>
          `,
        )}
      </div>
    `;
  }

  static styles = css`
    .interface-details {
      margin-left: 48px;
    }

    .permission-group {
      margin-bottom: 1em;
      width: 100%;

      .permission-name,
      .description,
      .routes {
        display: flex;
        flex-direction: column;
      }

      .label {
        text-transform: uppercase;
        font-size: 0.7rem;
        font-weight: bold;
      }

      .value {
        font-family: "Comic Neue";
      }
    }

    .sev-options {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.75em;
      text-transform: uppercase;
      font-size: 0.7rem;

      .low {
        color: var(--sl-color-green-700);
      }
      .medium {
        color: var(--sl-color-amber-700);
      }
      .high {
        color: var(--sl-color-red-700);
      }

      span {
        opacity: 0.3;
      }

      .selected {
        font-weight: bold;
        opacity: 1;
        border: 1px solid;
        border-radius: 2px;
        padding: 1px 4px;
      }
    }

    .empty {
      width: 100%;
      color: var(--sl-color-neutral-600);
      box-sizing: border-box;
      border: dashed 1px var(--sl-color-neutral-200);
      border-radius: var(--sl-border-radius-medium);
      padding: var(--sl-spacing-x-large) var(--sl-spacing-medium);
      font-family: 'Comic Neue', sans-serif;
      text-align: center;
    }
  `;
}

customElements.define("x-action-interface-list", InterfaceList);