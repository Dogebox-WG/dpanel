import { html, choose, unsafeHTML } from "/vendor/@lit/all@3.1.2/lit-all.min.js";

export function renderPopoverPage(open_page) {
  const pupDefinitionContext = this.context.store?.pupDefinitionContext
  const pkg = this.pkgController.getPupDefinition(pupDefinitionContext.source.id, pupDefinitionContext.id);
  return html`
    ${choose(open_page, [
      ['logs', () => html`<log-viewer ?autostart=${true} pupId="${pkg.manifest.id}"></log-viewer>`],
    ],
    () => html`<span>View not provided</span>`)}
  `
}