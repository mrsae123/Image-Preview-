// Image Preview — plugin entry script.
// Currently only registers the "Reset FAB position" sidebar action.
tavo.plugin.onSidebarAction('reset-fab-position', async () => {
  // Clear the saved position so the FAB falls back to its default corner on next load.
  try { tavo.set('emonImageViewerFabPosition', null, 'global'); } catch {}

  // If Image Preview's panel is currently mounted on this chat page, snap the button back
  // right away instead of waiting for the next chat open.
  try { window.dispatchEvent(new CustomEvent('emon-iv-fab-reset')); } catch {}

  // Confirm the action fired and finished — this is a one-shot action, not a toggle,
  // so there is nothing left "on" to turn back off.
  try { tavo.utils.toast(tavo.plugin.i18n.t('runtime.fabResetToast')); } catch {}
});
