import { html, css } from '/lib/lit-all.js';
import type { PupSnapshot } from '../index.js';

export function renderSectionScreens(this: PupSnapshot) {

  // TODO: image urls provided by manifest possibly or scrap this.
  const imageUrls = [
    'https://placebeard.it/640x460',
    'https://baconmockup.com/640/460',
    'https://placebear.com/640/460',
    'https://placebeard.it/640x760',
  ]

  const showDialogWithImage = (imageUrl: string) => {
    const imageDialog = this.shadowRoot?.querySelector('.image-dialog') as
      (HTMLElement & { show: () => void }) | null;
    if (!imageDialog) return;
    const dialogImage = imageDialog.querySelector('.dialog-image') as HTMLImageElement | null;
    if (!dialogImage) return;
    dialogImage.src = imageUrl;
    imageDialog.show();
  };

  return html`
    <sl-tab slot="nav" panel="screens">Screenshots &nbsp;<sl-tag pill size="small" outline>${imageUrls.length}</sl-tag></sl-tab>
    <sl-tab-panel name="screens">
      <div class="image-grid">
        ${imageUrls.map(url => html`
          <img
            src="${url}"
            alt="Screenshot"
            @click="${() => showDialogWithImage(url)}"
          />
        `)}
      </div>    
    </sl-tab-panel>

    <sl-dialog class="image-dialog" style="--width: auto;">
      <img src="" alt="Preview" class="dialog-image" />
    </sl-dialog>

    <style>${screenshotStyles}</style>
  `
}

const screenshotStyles = css`
  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }

  .image-grid img {
    opacity: 0.35;
    width: 100%;
    height: auto;
    object-fit: cover;
    transition: opacity 0.25s;
  }

  .image-grid img:first-of-type {
    opacity: 1;
  }

  .image-grid:hover img {
    opacity: 0.35;
  }

  .image-grid img:hover {
    opacity: 1;
  }
`;

