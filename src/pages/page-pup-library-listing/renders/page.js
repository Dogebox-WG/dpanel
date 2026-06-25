import { html, choose, unsafeHTML } from "/lib/lit-all.js";

export function renderPopoverPage(open_page) {
  const pupContext = this.context.store?.pupContext
  const pkg = this.pkgController.getPup(pupContext.id);
  return html`
    ${choose(open_page, [
      ['logs', () => html`<log-viewer ?autostart=${true} pupId="${pkg.manifest.id}"></log-viewer>`],
    ],
    () => html`<span>View not provided</span>`)}
  `
}