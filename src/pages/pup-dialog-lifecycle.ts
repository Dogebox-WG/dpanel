interface PupDialogState {
  dialog_open: boolean;
  open_dialog: string;
  open_dialog_label: string;
}

export function openPupDialog(state: PupDialogState, element: HTMLElement) {
  showPupDialog(
    state,
    element.getAttribute("name") ?? "",
    element.getAttribute("label") ?? "",
  );
}

export function showPupDialog(
  state: PupDialogState,
  view: string,
  label: string,
) {
  state.open_dialog = view;
  state.open_dialog_label = label;
  state.dialog_open = true;
}

export function closePupDialog(state: PupDialogState) {
  state.dialog_open = false;
}

export function handlePupDialogHide(state: PupDialogState, event: Event) {
  if (event.target !== event.currentTarget) return;
  state.dialog_open = false;
}

export function handlePupDialogAfterHide(
  state: PupDialogState,
  event: Event,
) {
  if (event.target !== event.currentTarget) return;
  state.open_dialog = "";
  state.open_dialog_label = "";
}
