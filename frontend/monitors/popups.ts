import type { Awaitable, Voidable } from '../helpers.js';
import Steam from '../steam.js';

export enum PopupType {
  Desktop = 'desktop',
  Gamepad = 'gamepad',
  Modal = 'modal',
  ContextMenu = 'contextmenu',
  Unknown = 'unknown',
}

/**
 * Monitor Steam popups and trigger when an action is made on them
 * @param onOpen Callback to trigger when a popup is opened
 * @returns A function to stop monitoring
 */
export function onPopupCreate(
  onOpen: (
    popup: Steam.Popup,
    type: PopupType,
    handlers: {
      onOpen: (onOpen: VoidFunction) => void;
      onClose: (onClose: VoidFunction) => void;
    },
  ) => Awaitable<Voidable<VoidFunction>>,
) {
  const cleanupSet = new Set<VoidFunction>();

  async function handlePopupCreate(popup: Steam.Popup) {
    const onCloseSet = new Set<VoidFunction>();

    let type: PopupType = PopupType.Unknown;
    if (popup.window?.name.startsWith('SP Desktop_')) type = PopupType.Desktop;
    else if (popup.window?.name.startsWith('SP BPM_')) type = PopupType.Gamepad;
    else if (popup.window?.name.startsWith('PopupWindow_'))
      type = PopupType.Modal;
    else if (popup.window?.name.startsWith('contextmenu_'))
      type = PopupType.ContextMenu;

    const onClose = await onOpen(popup, type, {
      onOpen: (cb: VoidFunction) => cb(),
      onClose: (cb: VoidFunction) => onCloseSet.add(cb),
    });
    if (onClose) onCloseSet.add(onClose);

    const beforeUnload = () => onCloseSet.forEach((cb) => cb());
    popup.window?.addEventListener('beforeunload', beforeUnload);
    cleanupSet.add(() =>
      popup.window?.removeEventListener('beforeunload', beforeUnload),
    );
  }

  const mainWindow = //
    Steam.PopupManager.GetExistingPopup(Steam.DesktopWindowName);
  if (mainWindow) handlePopupCreate(mainWindow);
  const gamepadWindow = //
    Steam.PopupManager.GetExistingPopup(Steam.GamepadWindowName);
  if (gamepadWindow) handlePopupCreate(gamepadWindow);
  Steam.PopupManager.AddPopupCreatedCallback(handlePopupCreate);

  return () => {
    const callbacks =
      Steam.PopupManager.m_rgPopupCreatedCallbacks.m_vecCallbacks;
    callbacks.splice(callbacks.indexOf(handlePopupCreate), 1);
    cleanupSet.forEach((cb) => cb());
  };
}
