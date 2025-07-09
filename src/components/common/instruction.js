import { html, nothing } from "/vendor/@lit/all@3.1.2/lit-all.min.js";

export function instruction({ 
  img = '',
  text = '',
  subtext = ''
}) {
  if (!document.body.hasAttribute('listener-on-instruction-dialog')) {
    document.body.addEventListener('sl-after-hide', closeInstructionDialog);
    document.body.setAttribute('listener-on-instruction-dialog', true);
  }

  // Dialog element
  const dialog = document.createElement('sl-dialog');
  dialog.classList.add("instruction-dialog");
  dialog.label = '';
  dialog.noHeader = true;
  
  // Prevent closing by escape or clicking outside
  dialog.setAttribute('no-header', '');
  dialog.addEventListener('sl-request-close', (e) => { 
    e.stopPropagation();
    e.preventDefault();
    }
  );

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

  dialog.appendChild(content);
  document.body.append(dialog);
  dialog.show();
}

function closeInstructionDialog(e) {
  if (e.target.classList.contains('instruction-dialog')) {
    e.target.remove();
  }
}