import { openDbxModal } from "/components/common/dbx-modal/open-modal.js";

export function notYet(event) {
  event && event.preventDefault && event.preventDefault();
  event && event.stopPropagation && event.stopPropagation();

  let modal;
  modal = openDbxModal({
    title: "Coming soon",
  });
  modal.classList.add("not-yet-dialog");
}