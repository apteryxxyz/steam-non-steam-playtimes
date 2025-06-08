import OnLibraryAppLoaded from './library-app/index.js';
import logger from './logger.js';
import { monitorActiveLocation, monitorRunningApps } from './monitor.js';
import { onAppPing, onAppStart, onAppStop } from './rpc.js';
import Steam from './steam.js';

export default async function () {
  const main = Steam.PopupManager.GetExistingPopup(Steam.MainWindowName);
  if (main) OnWindowCreated(main);
  Steam.PopupManager.AddPopupCreatedCallback(OnWindowCreated);

  monitorRunningApps({
    onStart: onAppStart,
    onStill: onAppPing,
    onStop: onAppStop,
  });
  logger.info('Starting to monitor running apps...');
}

async function OnWindowCreated(context: Steam.PopupContext) {
  if (context.m_strName !== Steam.MainWindowName) return;

  async function onChange(location: Steam.MainWindowBrowserLocation) {
    if (location.pathname.startsWith('/library/app/'))
      await OnLibraryAppLoaded(context.m_popup, location.pathname);
  }

  // Previously we used browser.on('finished-request') to monitor the current location
  // but that was unreliable and was not always firing. This is a more reliable way
  monitorActiveLocation({
    onChange: onChange,
  });
  logger.info('Starting to monitor active location...');
}
