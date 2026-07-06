import {
  LitElement,
  html,
  css,
  nothing,
} from "/lib/lit-all.js";
import "/components/common/action-row/action-row.js";

import { getProviders } from "/api/providers/providers.js";
import { pkgController } from "/controllers/package/index.js";
import { getRouter } from "/router/index.js";
import { asyncTimeout } from "/utils/timeout.js";
import { createAlert } from "/components/common/alert.js";
import { doBootstrap } from "/api/bootstrap/bootstrap.js";
import type { ProviderInfo, InstallableProvider } from "/api/providers/providers.js";

interface Dependency {
  interfaceName: string;
  interfaceVersion?: string;
  permissionGroups?: string[];
  source?: InstallableProvider;
}

class DependencyList extends LitElement {
  declare ready: boolean;
  declare dependencies: Dependency[];
  declare current_providers: Record<string, unknown>; // pup.state.providers
  declare possible_providers: ProviderInfo[]; // Obtained from providers API
  declare expandedDependency: string;
  declare editMode: boolean;
  declare pupId: string;
  declare inflight: boolean;

  static get properties() {
    return {
      ready: { type: Boolean },
      dependencies: { type: Array },
      current_providers: { type: Object }, // pup.state.providers
      possible_providers: { type: Array }, // Obtained from providers API
      expandedDependency: { type: String },
      editMode: { type: Boolean },
      pupId: { type: String },
      inflight: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.possible_providers = [];
    this.current_providers = {};
  }

  firstUpdated() {
    this.addEventListener("sl-hide", this.handleHide);
    if (this.editMode) {
      this.refreshProviders();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("sl-hide", this.handleHide);
  }

  handleHide(e: Event) {
    e.stopPropagation();
  }

  handleExpand(dependencyName: string) {
    this.expandedDependency =
      this.expandedDependency === dependencyName ? "" : dependencyName;
  }

  handleProviderSelection(event: CustomEvent<{ item?: { value?: string } }>, dependency: Dependency) {
    event.stopPropagation();

    const value = event.detail?.item?.value;
    if (!value) return;

    // Installed pups use pupId::; store-only pups use sourceLocation::.
    const isInstalledPup = value.startsWith("pupId::");

    if (!isInstalledPup) {
      const exploreUrl = this.getExploreUrlForProviderValue(value);
      getRouter()?.go(exploreUrl);
      return;
    }

    const pupId = value.split("::")[1];
    const providerInfo = this.possible_providers.find(
      (p) => p.interface === dependency.interfaceName,
    );
    if (providerInfo) {
      providerInfo.currentProvider = pupId;
    }

    this.requestUpdate();
  }

  // Parse sourceLocation::url::pupName=name menu values into an explore URL.
  getExploreUrlForProviderValue(value: string) {
    if (!value.startsWith("sourceLocation::")) {
      return "/explore";
    }

    const parts = value.split("::");
    const sourceLocation = parts[1];
    const pupNamePart = parts.find((p) => p.startsWith("pupName="));
    const pupName = pupNamePart?.split("=")[1];

    if (pupName && sourceLocation) {
      const sources = pkgController.getSourceList?.() || [];
      const match = sources.find((s) => s.location === sourceLocation);
      if (match?.sourceId) {
        return `/explore/${match.sourceId}/${encodeURIComponent(pupName)}`;
      }
    }

    return "/explore";
  }

  handleExploreClick(event: Event, interfaceName: string | undefined) {
    event.stopPropagation();
    const targetPath = "/explore";
    const params = new URLSearchParams();
    if (interfaceName) {
      params.set("search", interfaceName);
      params.set("interfaces", "1");
    }
    const query = params.toString();
    const targetUrl = query ? `${targetPath}?${query}` : targetPath;
    const router = getRouter();
    router?.go(targetPath);
    window.history.replaceState({}, "", targetUrl);
  }

  handleStoreListingClick(event: Event, url: string | null) {
    event.stopPropagation();
    if (url) {
      getRouter()?.go(url);
    }
  }

  async refreshProviders() {
    this.ready = false;
    await asyncTimeout(1000);
    try {
      const res = await getProviders(this.pupId);
      this.possible_providers = res;
      this.requestUpdate();
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      this.ready = true;
    }
  }

  handleRefreshClick() {
    this.refreshProviders();
  }

  toInstallableProviderObj(pupId: string) {
    const { pup } = pkgController.getPupMaster({ pupId });
    if (!pup?.state) {
      return {
        pupId,
        pupName: pupId,
        sourceName: "",
        sourceLocation: "",
        version: "",
      };
    }
    return {
      pupId: pup.state.id,
      pupName: pup.state.manifest.meta.name,
      sourceName: pup.state.source.name,
      sourceLocation: pup.state.source.location,
      version: pup.state.version,
    };
  }

  renderPermissionGroups(groups: string[] | undefined) {
    if (!groups || groups.length === 0) {
      return html`<p>No permission groups specified.</p>`;
    }
    return html`
      <div class="permission-group-list">
        ${groups.map((group) => html`<sl-tag size="small">${group}</sl-tag>`)}
      </div>`;
  }
  
  renderProviderForInterface(providerInfo: ProviderInfo | undefined, dependency: Dependency) {
    if (!providerInfo || !providerInfo.currentProvider) {
      return html`No provider set`
    }

    // display selected/current provider
    if (providerInfo && providerInfo.currentProvider) {
      const pup = this.toInstallableProviderObj(providerInfo.currentProvider)
      return html`
        <x-puplibrary-item
          id="${pup.pupId}"
          name=${pup.pupName}
          location=${pup.sourceLocation}
          version=${pup.version}>
        </x-puplibrary-item>
      `
    }
  }

  async handleSaveProviderClick(providerInfo: ProviderInfo | undefined) {
    if (!providerInfo) return;
    this.inflight = true;
    
    let body: Record<string, string | undefined> = {}
    body[providerInfo.interface] = providerInfo.currentProvider
    // Eg: { "pingpong": "a662052f6dc3d95d69a7604fa7b12b23" }

    const callbacks = {
      onSuccess: async () => {
        createAlert("success", ['Provider set.', 'Such wow!'], 'check-square', 2000);
        this.inflight = false;
      },
      onError: async (err?: unknown) => {
        console.log('Failed to set provider', err);
        const message = ["Failed to set provider"];
        const action = { text: "View details" };
        createAlert("danger", message, "emoji-frown", null, action, new Error(String((err as { error?: unknown })?.error)));
        this.inflight = false;
      },
      onTimeout: async () => {
        await doBootstrap();
        window.location.href = window.location.origin + "/pups";
        this.inflight = false;
      }
    }
    await pkgController.requestPupAction(this.pupId, 'set-provider', callbacks, body);
  }

  renderDependency(dependency: Dependency) {
    const providerInfo = this.possible_providers.find(p => p.interface === dependency.interfaceName);
    
    return html`
      <sl-card class="dependency" style="--width: 100%">
        <div class="permission-groups">
          <span class="label">Required Permissions</span>
          ${this.renderPermissionGroups(dependency.permissionGroups)}

          <sl-divider></sl-divider>

          ${this.editMode ? html`
            <div class="label-wrap">
              <span class="label">Select Provider</span>
              <sl-button variant="text" size="small" class="button-no-pad" ?disabled=${!this.ready || this.inflight } @click=${this.handleRefreshClick}>Refresh</sl-button>
            </div>
            
            <sl-dropdown class="provider-picker" hoist @sl-select="${(e: CustomEvent<{ item?: { value?: string } }>) => this.handleProviderSelection(e, dependency)}">
              <sl-button size="large" slot="trigger" class="provider-selector" ?disabled=${!this.ready || this.inflight }>
                ${!this.ready
                  ? html`<span style="display: flex; flex-direction: row; align-items: center; gap: 1em;"><sl-spinner></sl-spinner> Checking..</span>`
                  : html `
                    <span id="selected-text-${dependency.interfaceName}">
                    ${this.renderProviderForInterface(providerInfo, dependency)}
                  </span>`
                }
                
                <sl-icon name="chevron-down"></sl-icon>
              </sl-button>
              
              ${!this.ready ? html`
                <sl-menu>
                  <sl-menu-item disabled>
                    <div style="display: flex; flex-direction: row; align-items: center; gap: 1em;">
                      <sl-spinner></sl-spinner> Fetching ..
                    </div>
                  </sl-menu-item>
                </sl-menu>
              `: nothing } 
              
              ${this.ready ? html`
                <sl-menu>
                  <sl-menu-label>Installed Pups</sl-menu-label>

                  ${ providerInfo &&
                     !providerInfo.installedProviders.length &&
                     !providerInfo.InstallableProviders.length ? html`
                      <sl-menu-item disabled><small>-- Such empty --</small></sl-menu-item>
                    ` : nothing
                   }
                  
                  ${providerInfo && providerInfo.installedProviders.length ? 
                    providerInfo.installedProviders
                      .map(pupId => this.toInstallableProviderObj(pupId))
                      .map(provider => html`
                      <sl-menu-item value="pupId::${provider.pupId}">
                        <x-puplibrary-item
                          id="${provider.pupId}"
                          name=${provider.pupName}
                          location=${provider.sourceLocation}
                          version=${provider.version}>
                        </x-puplibrary-item>
                      </sl-menu-item>
                    `) : nothing
                  }
                  
                  <sl-menu-label>Available Pups</sl-menu-label>

                  ${providerInfo && providerInfo.InstallableProviders.length ? 
                    providerInfo.InstallableProviders
                      .map(provider => html`
                      <sl-menu-item value="sourceLocation::${provider.sourceLocation}::pupName=${provider.pupName}">
                        <x-pupstore-item
                          name=${provider.pupName}
                          location=${provider.sourceLocation}
                          version=${provider.pupVersion}>
                        </x-pupstore-item>
                      </sl-menu-item>
                    `) : nothing
                  }
                  
                </sl-menu>
              `: nothing }
            </sl-dropdown>

            <sl-button
              @click=${() => this.handleSaveProviderClick(providerInfo)}
              ?loading=${this.inflight}
              ?disabled=${this.inflight || (providerInfo && !providerInfo.currentProvider)}
              class="submit-provider-button"
              size="small" variant="primary">
                Save Selection
            </sl-button>

            <sl-divider></sl-divider>

            <span class="label" style="margin-bottom:0.25em;">Default Provider</span>
            ${this.renderDefaultProvider(dependency, providerInfo)}

            <sl-divider></sl-divider>

            <span class="label" style="margin-bottom:0.25em;">Other Providers</span>
            <sl-button variant="text" class="link-button-left" @click=${(e: Event) => this.handleExploreClick(e, dependency.interfaceName)}>
              <sl-icon name="box-arrow-up-right" slot="suffix"></sl-icon>
              Browse the Pup Store for compatible Pups
            </sl-button>

          ` : html`
            <span class="label" style="margin-bottom:0.25em;">Default Provider</span>
            ${(() => {
              const defaultProvider = this.getDefaultProvider(dependency, providerInfo);
              const display = this.getDefaultProviderDisplay(defaultProvider);
              const storeUrl = this.getProviderStoreUrl(defaultProvider);

              return html`
                <small>
                  <sl-tag slot="suffix">
                    ${display || 'No default provider'}
                  </sl-tag>
                </small>
                ${storeUrl ? html`
                  <sl-button variant="text" class="link-button-left" @click=${(e: Event) => this.handleStoreListingClick(e, storeUrl)}>
                    <sl-icon name="box-arrow-up-right" slot="suffix"></sl-icon>
                    View in Pup Store
                  </sl-button>
                ` : nothing}
              `;
            })()}

            <sl-divider></sl-divider>

            <span class="label" style="margin-bottom:0.25em;">Other Providers</span>
            <sl-button variant="text" class="link-button-left" @click=${(e: Event) => this.handleExploreClick(e, dependency.interfaceName)}>
              <sl-icon name="box-arrow-up-right" slot="suffix"></sl-icon>
              Browse the Pup Store for compatible Pups
            </sl-button>
          `}
        </div>
      </sl-card>
    `;
  }

  renderDefaultProvider(dependency: Dependency, providerInfo: ProviderInfo | undefined) {
    const defaultProvider = this.getDefaultProvider(dependency, providerInfo);
    const display = this.getDefaultProviderDisplay(defaultProvider);

    if (!display) return html`
      <small>No default provider.</small>
    `

    const storeUrl = this.getProviderStoreUrl(defaultProvider);

    return html`
      <small>
        <sl-tag slot="suffix" size="small">
          ${display}
        </sl-tag>
      </small>

      ${storeUrl ? html`
        <sl-button variant="text" class="link-button-left" @click=${(e: Event) => this.handleStoreListingClick(e, storeUrl)}>
          <sl-icon name="box-arrow-up-right" slot="suffix"></sl-icon>
          View in Pup Store
        </sl-button>
      ` : nothing}
    `
  }

  getDefaultProvider(dependency: Dependency, providerInfo: ProviderInfo | undefined) {
    const fromApi = providerInfo?.DefaultProvider;
    if (fromApi?.pupName && fromApi?.sourceLocation) {
      return fromApi;
    }

    // Explore view (no editMode / no pupId) reads deps from the store manifest
    // only — the providers API is never called, so fall back to manifest source.
    const fromManifest = dependency?.source;
    if (fromManifest?.pupName && fromManifest?.sourceLocation) {
      return fromManifest;
    }

    return null;
  }

  getDefaultProviderDisplay(provider: InstallableProvider | null) {
    if (!provider?.pupName || !provider?.sourceLocation) {
      return false;
    }

    return `${provider.pupName} (${provider.sourceLocation})`;
  }

  // Resolve a /explore/:sourceid/:pupname URL for a provider entry that only
  // carries sourceLocation + pupName. Returns null when the source is not
  // present in the local sources index (e.g. source not added on this dogebox).
  getProviderStoreUrl(provider: InstallableProvider | null) {
    if (!provider) return null;
    const { pupName, sourceLocation } = provider;
    if (!pupName || !sourceLocation) return null;

    const sources = pkgController.getSourceList?.() || [];
    const match = sources.find(s => s.location === sourceLocation);
    if (!match || !match.sourceId) return null;

    return `/explore/${match.sourceId}/${encodeURIComponent(pupName)}`;
  }

  render() {
    return html`
      <div>
        ${this.dependencies && this.dependencies.length === 0
          ? html`
              <div class="empty">
                Wow, such independence.<br />
                This pup has no dependencies.
              </div>
            `
          : nothing}
        ${this.dependencies.map(
          (dep) => html`
            <action-row
              label="${dep.interfaceName}"
              prefix="box"
              expandable
              ?expand=${this.expandedDependency === dep.interfaceName}
              @row-expand=${() => this.handleExpand(dep.interfaceName)}
            >
              <span>Version: ${dep.interfaceVersion}</span>
              <div
                class="dependency-details"
                slot="hidden"
                id="details-${dep.interfaceName}"
              >
                ${this.renderDependency(dep)}
              </div>
            </action-row>
          `,
        )}
      </div>
    `;
  }

  static styles = css`
    .dependency-details {
      margin-left: 48px;
    }

    .dependency {
      margin-bottom: 1em;
      width: 100%;

      .dependency-name,
      .version,
      .permission-groups,
      .source {
        display: flex;
        flex-direction: column;
      }

      .label-wrap {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
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

    sl-button.button-no-pad::part(base),
    sl-button.button-no-pad::part(label) {
      padding: 0px;
      margin: 0px;
    }

    .empty {
      width: 100%;
      color: var(--sl-color-neutral-600);
      box-sizing: border-box;
      border: dashed 1px var(--sl-color-neutral-200);
      border-radius: var(--sl-border-radius-medium);
      padding: var(--sl-spacing-x-large) var(--sl-spacing-medium);
      font-family: "Comic Neue", sans-serif;
      text-align: center;
    }

    .provider-selector {
      width: 100%;
      &::part(label) {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
      }
    }

    .submit-provider-button {
      width: 115px;
      align-self: end;
      margin-top: 0.5em;
    }

    sl-button.link-button-left::part(base) { justify-content: left; }
    sl-button.link-button-left::part(label) { padding-left:0px; }

    .provider-picker {
      sl-menu-label { display: none; }
      sl-menu-label::part(base) { font-size: 0.8rem; }
    }
  `;
}

customElements.define("x-action-manage-deps", DependencyList);

class PupStoreItem extends LitElement {
  declare name: string;
  declare location: string;
  declare version: string;

  static get properties() {
    return {
      name: { type: String },
      location: { type: String },
      version: { type: String }
    }
  }
  render() {
    return html`
      <span class="name">
        ${this.name}${this.version ? html` <small class="version">v${this.version}</small>` : nothing}
        <small class="tag">(Not installed)</small>
      </span><br>
      <small class="location">${this.location}</small>
    `
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: start;
      line-height: 1.35;
    }
    .name {
      font-weight: bold;
      font-size: 0.9rem;
      color: grey;
    }
    .location {
      font-size: 0.7rem;
      font-family: 'Comic Neue';
    }
    .tag {
      font-size: 0.7rem;
      color: grey;
      font-weight: normal;
    }
    .version {
      font-size: 0.8rem;
      color: var(--sl-color-neutral-500);
      font-weight: normal;
    }
    `
}

customElements.define('x-pupstore-item', PupStoreItem);

class PupLibraryItem extends LitElement {
  declare name: string;
  declare location: string;
  declare id: string;
  declare version: string;

  static get properties() {
    return {
      name: { type: String },
      location: { type: String },
      id: { type: String },
      version: { type: String }
    }
  }
  render() {
    return html`
      <span class="name">
        ${this.name}${this.version ? html` <small class="version">v${this.version}</small>` : nothing}
        <small class="tag">(Installed)</small>
      </span><br>
      <small class="location">${this.location}</small>
    `
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: start;
      line-height: 1.35;
    }
    .name {
      font-weight: bold;
      font-size: 0.9rem;
      color: white;
    }
    .location {
      font-size: 0.7rem;
      font-family: 'Comic Neue';
    }
    .version {
      font-size: 0.8rem;
      color: var(--sl-color-neutral-400);
      font-weight: normal;
    }
    .tag {
      font-size: 0.7rem;
      color: var(--sl-color-neutral-400);
      font-weight: normal;
    }
  `
}

customElements.define('x-puplibrary-item', PupLibraryItem);