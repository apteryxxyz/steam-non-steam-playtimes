import Steam from '../steam.js';

/**
 * Monitor Steam popups/windows
 * @param options Options for the monitor
 */
export function monitorPopups({
  onCreate,
}: {
  onCreate?(popup: Steam.Popup): Promise<void>;
}) {
  const mainWindow = Steam.PopupManager.GetExistingPopup(Steam.MainWindowName);
  if (mainWindow && onCreate) onCreate(mainWindow).catch(console.error);
  if (onCreate)
    Steam.PopupManager.AddPopupCreatedCallback((p) =>
      onCreate(p).catch(console.error),
    );
}
