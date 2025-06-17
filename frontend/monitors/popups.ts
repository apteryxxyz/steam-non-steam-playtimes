import Steam from '../steam.js';

export async function monitorPopups({
  onCreated,
}: {
  onCreated?(popup: Steam.Popup): void;
}) {
  const mainWindow = Steam.PopupManager.GetExistingPopup(Steam.MainWindowName);
  if (mainWindow && onCreated) onCreated(mainWindow);
  if (onCreated) Steam.PopupManager.AddPopupCreatedCallback(onCreated);
}
