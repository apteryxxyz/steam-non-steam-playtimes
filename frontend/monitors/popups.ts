import Steam from '../steam.js';

/**
 * Monitor Steam popups/windows
 * @param options Options for the monitor
 */
export async function monitorPopups({
  onCreate,
}: {
  onCreate?(popup: Steam.Popup): void;
}) {
  const mainWindow = Steam.PopupManager.GetExistingPopup(Steam.MainWindowName);
  if (mainWindow && onCreate) onCreate(mainWindow);
  if (onCreate) Steam.PopupManager.AddPopupCreatedCallback(onCreate);
}
