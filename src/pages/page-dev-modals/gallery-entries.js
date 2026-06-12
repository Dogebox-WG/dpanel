import { areYouSure } from "/components/common/are-you-sure.js";
import { notYet } from "/components/common/not-yet-implemented.js";
import { instruction } from "/components/common/instruction.js";

/** Close body-appended legacy dialogs opened by imperative helpers. */
export function closeLegacyBodyDialogs() {
  document
    .querySelectorAll(
      "sl-dialog.confirmation-dialog, sl-dialog.not-yet-dialog, sl-dialog.instruction-dialog, sl-dialog.error-dialog",
    )
    .forEach((el) => {
      el.hide();
      el.remove();
    });
}

function openLegacyDeleteSshKeyDialog() {
  const dialog = document.createElement("sl-dialog");
  dialog.classList.add("gallery-legacy-dialog");
  dialog.label = "Are you sure?";
  dialog.innerHTML = `
    <div class="confirmation-container" style="display:flex;flex-direction:row;align-items:center;justify-content:center;gap:1em;">
      <sl-button variant="text" class="cancel">I changed my mind</sl-button>
      <sl-button variant="danger" class="confirm">Yes, delete this SSH Public Key</sl-button>
    </div>
  `;
  dialog.querySelector(".cancel").addEventListener("click", () => dialog.hide());
  dialog.querySelector(".confirm").addEventListener("click", () => dialog.hide());
  dialog.addEventListener("sl-after-hide", () => dialog.remove());
  document.body.append(dialog);
  dialog.show();
}

function openLegacyAddSshKeyDialog() {
  const dialog = document.createElement("sl-dialog");
  dialog.classList.add("gallery-legacy-dialog");
  dialog.label = "Add an SSH Public Key";
  dialog.innerHTML = `
    <sl-textarea rows="6" help-text="Important: Enter your public key"></sl-textarea>
    <div slot="footer">
      <sl-button variant="text" class="cancel">I've changed my mind</sl-button>
      <sl-button variant="primary" class="submit">Submit</sl-button>
    </div>
  `;
  dialog.querySelector(".cancel").addEventListener("click", () => dialog.hide());
  dialog.querySelector(".submit").addEventListener("click", () => dialog.hide());
  dialog.addEventListener("sl-after-hide", () => dialog.remove());
  document.body.append(dialog);
  dialog.show();
}

function openLegacySettingsShell(contentTag, label = "") {
  const dialog = document.createElement("sl-dialog");
  dialog.classList.add("gallery-legacy-dialog");
  dialog.noHeader = true;
  const inner = document.createElement(contentTag);
  dialog.appendChild(inner);
  if (label) {
    dialog.setAttribute("data-label", label);
  }
  dialog.addEventListener("sl-after-hide", () => dialog.remove());
  document.body.append(dialog);
  dialog.show();
}

function openLegacyImportBlockchainDialog() {
  const dialog = document.createElement("sl-dialog");
  dialog.classList.add("gallery-legacy-dialog");
  dialog.noHeader = true;
  dialog.innerHTML = `
    <div style="padding: 1em;">
      <h3>Import Dogecoin Core Blockchain Data</h3>
      <p>This feature allows you to import existing Dogecoin Core blockchain data from an external drive, which can significantly speed up the initial synchronization process.</p>
      <div style="margin: 1em 0;">
        <h4>Prerequisites:</h4>
        <ul>
          <li>An external drive containing Dogecoin Core blockchain data ('blocks' and 'chainstate' directories at the root level of the drive)</li>
          <li>The drive should be connected and accessible</li>
        </ul>
      </div>
      <div style="margin: 1em 0;">
        <h4>What happens:</h4>
        <ol>
          <li>The system automatically finds and stops the Dogecoin Core pup if it's running</li>
          <li>Copies the blockchain data to the pup's storage</li>
          <li>Restarts the pup if it was previously running</li>
          <li>You can monitor the progress in real-time</li>
        </ol>
      </div>
      <div style="margin: 1em 0;">
        <h4>Important Notes:</h4>
        <ul>
          <li>The copy process can take a very long time depending on the blockchain size</li>
          <li>Dogecoin Core blockchain is approximately 200GB+ (as of 2025)</li>
          <li>Ensure your device has enough storage space for the blockchain data</li>
        </ul>
      </div>
    </div>
    <sl-button slot="footer" variant="primary">Start Import Process</sl-button>
    <sl-button slot="footer" variant="neutral" class="cancel">Cancel</sl-button>
  `;
  dialog.querySelector(".cancel")?.addEventListener("click", () => dialog.hide());
  dialog.addEventListener("sl-after-hide", () => dialog.remove());
  document.body.append(dialog);
  dialog.show();
}

function openLegacyMonitoringAddDialog() {
  const dialog = document.createElement("sl-dialog");
  dialog.classList.add("gallery-legacy-dialog");
  dialog.label = "Add Components";
  dialog.innerHTML = `
    <p style="text-align:center;color:#777;">Tab grid placeholder (CPU, Memory, Disk, Pups…)</p>
    <sl-button slot="footer" variant="default">Close</sl-button>
  `;
  dialog.addEventListener("sl-after-hide", () => dialog.remove());
  document.body.append(dialog);
  dialog.show();
}

function openLegacyManageSourcesAddDialog() {
  const dialog = document.createElement("sl-dialog");
  dialog.classList.add("gallery-legacy-dialog");
  dialog.noHeader = true;
  dialog.innerHTML = `
    <sl-input label="Enter source URL" placeholder="Eg: https://github.com/Dogebox-WG/pups.git"></sl-input>
    <div slot="footer">
      <sl-button variant="text" class="cancel">Cancel</sl-button>
      <sl-button variant="primary">Add this source</sl-button>
    </div>
  `;
  dialog.querySelector(".cancel")?.addEventListener("click", () => dialog.hide());
  dialog.addEventListener("sl-after-hide", () => dialog.remove());
  document.body.append(dialog);
  dialog.show();
}

function openLegacyPupUninstallDialog() {
  const dialog = document.createElement("sl-dialog");
  dialog.classList.add("gallery-legacy-dialog");
  dialog.label = "Uninstall";
  dialog.innerHTML = `
    <p>Are you sure you want to uninstall Example Pup?</p>
    <sl-input placeholder="Type 'Example Pup' to confirm"></sl-input>
    <sl-button slot="footer" variant="danger">Uninstall</sl-button>
  `;
  dialog.addEventListener("sl-after-hide", () => dialog.remove());
  document.body.append(dialog);
  dialog.show();
}

function openLegacyWelcomeModal() {
  const modal = document.createElement("x-welcome-modal");
  modal.open = true;
  modal.onClose = () => {
    modal.open = false;
    modal.remove();
  };
  modal.addEventListener("sl-after-hide", () => modal.remove());
  document.body.append(modal);
}

function openLegacyNestedDialog() {
  const parent = document.createElement("sl-dialog");
  parent.classList.add("gallery-legacy-dialog");
  parent.noHeader = true;
  parent.innerHTML = `<p style="text-align:center;padding:2em;">Settings shell (legacy no-header)</p>`;
  parent.addEventListener("sl-after-hide", () => parent.remove());
  document.body.append(parent);
  parent.show();

  setTimeout(() => {
    const child = document.createElement("sl-dialog");
    child.classList.add("gallery-legacy-dialog");
    child.label = "Nested confirm";
    child.innerHTML = `
      <p>Nested dialog inside settings shell</p>
      <sl-button slot="footer" variant="primary" class="ok">OK</sl-button>
    `;
    child.querySelector(".ok").addEventListener("click", () => child.hide());
    child.addEventListener("sl-request-close", (e) => e.stopPropagation());
    child.addEventListener("sl-after-hide", () => child.remove());
    document.body.append(child);
    child.show();
  }, 100);
}

export const IMPORT_BLOCKCHAIN_CUSTOM_HTML = `
  <div style="padding: 0 0.5em; text-align: left;">
    <p>This feature allows you to import existing Dogecoin Core blockchain data from an external drive, which can significantly speed up the initial synchronization process.</p>
    <div style="margin: 1em 0;">
      <h4>Prerequisites:</h4>
      <ul>
        <li>An external drive containing Dogecoin Core blockchain data ('blocks' and 'chainstate' directories at the root level of the drive)</li>
        <li>The drive should be connected and accessible</li>
      </ul>
    </div>
    <div style="margin: 1em 0;">
      <h4>What happens:</h4>
      <ol>
        <li>The system automatically finds and stops the Dogecoin Core pup if it's running</li>
        <li>Copies the blockchain data to the pup's storage</li>
        <li>Restarts the pup if it was previously running</li>
        <li>You can monitor the progress in real-time</li>
      </ol>
    </div>
    <div style="margin: 1em 0;">
      <h4>Important Notes:</h4>
      <ul>
        <li>The copy process can take a very long time depending on the blockchain size</li>
        <li>Dogecoin Core blockchain is approximately 200GB+ (as of 2025)</li>
        <li>Ensure your device has enough storage space for the blockchain data</li>
      </ul>
    </div>
  </div>
`;

/**
 * Gallery entry definitions for before/after modal comparison.
 * @typedef {Object} GalleryEntry
 * @property {string} id
 * @property {string} name
 * @property {string} beforeNote
 * @property {string} afterNote
 * @property {() => void} openBefore
 * @property {Object} after
 */

/** @type {GalleryEntry[]} */
export const GALLERY_ENTRIES = [
  {
    id: "shutdown",
    name: "Shutdown confirm",
    beforeNote: "no-header; no X; h3 title; Cancel below primary",
    afterNote: "h1 title; X + Escape + overlay; primary + Cancel",
    openBefore: () =>
      areYouSure({
        title: "Are you sure you want to power off?",
        description:
          "Physical access may be required to turn your Dogebox on again",
        topButtonText: "Yes, power off",
        topButtonClick: () => {},
      }),
    after: {
      title: "Are you sure you want to power off?",
      subtitle:
        "Physical access may be required to turn your Dogebox on again",
      primaryLabel: "Yes, power off",
      cancelLabel: "Cancel",
    },
  },
  {
    id: "reboot",
    name: "Reboot confirm",
    beforeNote: "Same as shutdown (areYouSure / x-confirmation-prompt)",
    afterNote: "h1 title; primary + Cancel",
    openBefore: () =>
      areYouSure({
        title: "Are you sure you want to reboot?",
        description:
          "Insert your recovery USB stick if you wish to enter recovery mode",
        topButtonText: "Yes, reboot now",
        topButtonClick: () => {},
      }),
    after: {
      title: "Are you sure you want to reboot?",
      subtitle:
        "Insert your recovery USB stick if you wish to enter recovery mode",
      primaryLabel: "Yes, reboot now",
      cancelLabel: "Cancel",
    },
  },
  {
    id: "coming-soon",
    name: "Coming soon",
    beforeNote: "Default header X; footer Close button",
    afterNote: "h1 title only; X + Escape + overlay",
    openBefore: () => notYet(),
    after: {
      title: "Coming soon",
    },
  },
  {
    id: "power-off-success",
    name: "Power-off success",
    beforeNote: "non-dismissable; no X; no buttons",
    afterNote: "non-dismissable; custom image section",
    openBefore: () =>
      instruction({
        img: "/static/img/bye.png",
        text: "Dogebox turned off successfully.<br>You may close this page.",
        subtext: "",
      }),
    after: {
      title: "Dogebox turned off successfully",
      subtitle: "You may close this page.",
      dismissable: false,
      customKey: "power-off-success",
    },
  },
  {
    id: "error-details",
    name: "Error details",
    beforeNote: "label header; footer Close",
    afterNote: "title + custom pre blocks + footer Close",
    openBefore: () => {
      const dialog = document.createElement("sl-dialog");
      dialog.classList.add("gallery-legacy-dialog", "error-dialog");
      dialog.label = "Error details";
      dialog.innerHTML = `
        <pre style="text-wrap:wrap;font-size:var(--sl-font-size-small);padding:1em;background:#333;">Something went wrong</pre>
        <pre style="text-wrap:wrap;font-size:var(--sl-font-size-small);padding:1em;background:#a300ff70;margin-bottom:0;">Example error for gallery</pre>
        <pre style="font-size:var(--sl-font-size-x-small);padding:1em;background:#c700ff21;overflow-x:scroll;margin-top:0;">Error: Example error for gallery</pre>
        <div slot="footer"><sl-button class="close">Close</sl-button></div>
      `;
      dialog.querySelector(".close").addEventListener("click", () => dialog.hide());
      dialog.addEventListener("sl-after-hide", () => dialog.remove());
      document.body.append(dialog);
      dialog.show();
    },
    after: {
      title: "Error details",
      footerLabel: "Close",
      customKey: "error-details",
    },
  },
  {
    id: "system-updates",
    name: "System updates",
    beforeNote: "settings shell no-header; internal h1",
    afterNote: "shell title + custom section (check-updates content)",
    openBefore: () => openLegacySettingsShell("x-action-check-updates"),
    after: {
      title: "System Updates",
      customKey: "system-updates",
    },
  },
  {
    id: "import-blockchain",
    name: "Import blockchain",
    beforeNote: "no-header; h3 + inline lists; Start + Cancel footer",
    afterNote: "h1 title; lists in custom section; footer Start Import",
    openBefore: () => openLegacyImportBlockchainDialog(),
    after: {
      title: "Import Dogecoin Core Blockchain Data",
      footerLabel: "Start Import Process",
      customKey: "import-blockchain",
    },
  },
  {
    id: "remote-access",
    name: "Remote access",
    beforeNote: "settings shell; internal h1",
    afterNote: "shell title + SSH custom section",
    openBefore: () => openLegacySettingsShell("x-action-remote-access"),
    after: {
      title: "Remote Access",
      customKey: "remote-access",
    },
  },
  {
    id: "delete-ssh-key",
    name: "Delete SSH key",
    beforeNote: "label header; inline Cancel + danger buttons in body",
    afterNote: "title + subtitle + primary + Cancel",
    openBefore: () => openLegacyDeleteSshKeyDialog(),
    after: {
      title: "Are you sure?",
      subtitle: "This SSH public key will be removed.",
      primaryLabel: "Yes, delete this SSH Public Key",
      primaryVariant: "danger",
      cancelLabel: "Cancel",
    },
  },
  {
    id: "add-ssh-key",
    name: "Add SSH key",
    beforeNote: "label header; Cancel + Submit in footer",
    afterNote: "custom textarea + footer Submit only",
    openBefore: () => openLegacyAddSshKeyDialog(),
    after: {
      title: "Add an SSH Public Key",
      footerLabel: "Submit",
      customKey: "add-ssh-key",
    },
  },
  {
    id: "language",
    name: "Language / Submit",
    beforeNote: "internal h1; align-end Submit in footer slot",
    afterNote: "title + custom form + footer Submit",
    openBefore: () => openLegacySettingsShell("x-action-language"),
    after: {
      title: "Language",
      footerLabel: "Submit",
      customKey: "language",
    },
  },
  {
    id: "welcome",
    name: "Welcome modal",
    beforeNote: "no-header; blocks overlay; footer Next",
    afterNote: "non-dismissable; title + custom cards + footer Next",
    openBefore: () => openLegacyWelcomeModal(),
    after: {
      title: "Welcome to Dogebox",
      dismissable: false,
      panelWidth: "600px",
      subtitle:
        "Since this may be your first time here, we can offer some help to get you setup quickly.\n\nPlease select one of the following Pup Collections you'd like to have automatically installed on your Dogebox.",
      footerLabel: "Next",
      customKey: "welcome",
    },
  },
  {
    id: "pup-uninstall",
    name: "Pup uninstall",
    beforeNote: "label header; confirm input + danger Uninstall in footer",
    afterNote: "title + subtitle + custom input + primary Uninstall + Cancel",
    openBefore: () => openLegacyPupUninstallDialog(),
    after: {
      title: "Uninstall",
      subtitle: "Are you sure you want to uninstall Example Pup?",
      primaryLabel: "Uninstall",
      primaryVariant: "danger",
      cancelLabel: "Cancel",
      customKey: "pup-uninstall",
    },
  },
  {
    id: "manage-sources-add",
    name: "Manage sources — add",
    beforeNote: "no-header; Cancel + Add in footer",
    afterNote: "title + custom input + footer Add this source",
    openBefore: () => openLegacyManageSourcesAddDialog(),
    after: {
      title: "Add pup source",
      footerLabel: "Add this source",
      customKey: "manage-sources-add",
    },
  },
  {
    id: "monitoring-add",
    name: "Monitoring add",
    beforeNote: "label header; footer Close",
    afterNote: "title + custom tabs + footer Close",
    openBefore: () => openLegacyMonitoringAddDialog(),
    after: {
      title: "Add Components",
      footerLabel: "Close",
      customKey: "monitoring-add",
    },
  },
  {
    id: "non-dismissable",
    name: "Non-dismissable (instruction)",
    beforeNote: "no-header; blocks all close sources",
    afterNote: "dismissable=false; no X; Escape/overlay blocked",
    openBefore: () =>
      instruction({
        img: "/static/img/again.png",
        text: "Rebooted.",
        subtext:
          "Please re-reconnect to the same network as your Dogebox and refresh.",
      }),
    after: {
      title: "Rebooted.",
      subtitle:
        "Please re-reconnect to the same network as your Dogebox and refresh.",
      dismissable: false,
      customKey: "reboot-success",
    },
  },
  {
    id: "nested",
    name: "Nested modal",
    beforeNote: "parent no-header shell + labelled child dialog",
    afterNote: "parent x-dbx-modal + nested x-dbx-modal",
    openBefore: () => openLegacyNestedDialog(),
    after: {
      title: "Settings",
      customKey: "nested",
    },
  },
];

export function closeAllGalleryLegacyDialogs() {
  closeLegacyBodyDialogs();
  document.querySelectorAll("sl-dialog.gallery-legacy-dialog").forEach((el) => {
    el.hide();
    el.remove();
  });
  document.querySelectorAll("x-welcome-modal").forEach((el) => el.remove());
}
