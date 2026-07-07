import { openDbxModal } from "/components/common/dbx-modal/open-modal.js";

export function instruction({ 
  img = '',
  text = '',
  subtext = ''
}) {
  // Create content
  const content = document.createElement('div');
  content.innerHTML = `
    <style>
      p.statement {
        text-align: center;
        font-size: 1.15rem;
        line-height: 1.5;
      }

      p small {
        display: block;
        line-height: 1.2;
        margin-top: .44rem;
        padding: 0 20%;
      }
    </style>
    <img style="width: 100%;" src="${img}" />
    <p class="statement">${text} <br><small>${subtext}</small></p>
  `;

  // Prevent closing by escape or clicking outside.
  const modal = openDbxModal({
    dismissable: false,
    customContent: content,
  });
  modal.classList.add("instruction-dialog");
}