import { html, choose, unsafeHTML } from "/lib/lit-all.js";
import "/components/views/action-dependency-manage/dependency.js";
import "/components/views/action-interface-list/interface.js";

export function renderDialog() {
  const pupContext = this.context.store?.pupContext
  const pkg = this.getPup();
  const interfacesArray = pkg?.def?.versions[pkg?.def?.latestVersion]?.interfaces || [];
  const depdenciesArray = pkg?.def?.versions[pkg?.def?.latestVersion]?.dependencies || [];
  const readmeEl = html`<div style="padding: 1em; text-align: center;"> Such empty. This pup does not provide a README.</div>`;
  const depsEl = html`<x-action-manage-deps .dependencies=${depdenciesArray}></x-action-manage-deps>`;
  const intsEl = html`<x-action-interface-list .interfaces=${interfacesArray}></x-action-interface-list>`;

  return html`
    ${choose(this.open_dialog, [
      ['readme', () => readmeEl],
      ['deps', () => depsEl],
      ['ints', () => intsEl],
    ],
    () => html`<span>View not provided: ${this.open_dialog}</span>`)}
  `
}