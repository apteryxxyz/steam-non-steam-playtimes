import './renderers/library-home.js';
import './renderers/app-properties.js';
import { NON_STEAM_APP_APPID_MASK } from './constants.js';
import logger from './logger.js';
import { onLocationChange } from './monitors/location.js';
import { onPopupCreate, PopupType } from './monitors/popups.js';
import { onAppLaunch } from './monitors/running-apps.js';
import OnLibraryAppLoaded from './renderers/library-app.js';
import rpc from './rpc.js';
import Steam from './steam.js';

export default async function OnPluginLoaded() {
  // ===== Monitor Running Apps ===== //
  // Monitor running applications to track non-steam app playtime sessions

  onAppLaunch((app, { onLaunch, onHeartbeat, onQuit }) => {
    if (app.appid < NON_STEAM_APP_APPID_MASK) return;
    const instanceId = Math.random().toString(36).slice(2);

    onLaunch(() => {
      logger.debug(
        `Non-steam app ${app.display_name} launched, starting session...`,
        { app, instanceId },
      );
      rpc.OnNonSteamAppLaunch(app, instanceId);
    });

    onHeartbeat(() => {
      logger.debug(
        `Non-steam app ${app.display_name} still running, pinging session...`,
        { app, instanceId },
      );
      rpc.OnNonSteamAppHeartbeat(app, instanceId);
      // TODO: Detect the mode and update the location accordingly
      Steam.MainWindowBrowserManager.m_lastLocation.hash += 'r';
    });

    onQuit(() => {
      logger.debug(
        `Non-steam app ${app.display_name} stopped, stopping session...`,
        { app, instanceId },
      );
      rpc.OnNonSteamAppQuit(app, instanceId);
    });
  });

  logger.info(
    'Started monitoring running apps for non-steam playtime tracking',
  );

  // ===== Monitor Steam Popups ===== //
  // Monitor Steam popups to detect when library pages are loaded

  onPopupCreate((popup, type) => {
    if (type !== PopupType.Desktop) return;

    // ===== Monitor Main Window Location ===== //

    logger.info('Started monitoring location changes in Steam window');
    return onLocationChange(
      () => {
        // if (type === PopupType.Gamepad) return popup.window?.opener?.location;
        return Steam.MainWindowBrowserManager?.m_lastLocation;
      },
      ({ pathname }) => {
        if (pathname.startsWith('/library/app/')) {
          const appId = Number(pathname.split('/')[3]);
          const app = Steam.AppStore.allApps //
            .find((app) => app.appid === appId)!;
          OnLibraryAppLoaded(popup.window!, app);
        }
      },
    );
  });

  logger.info('Started monitoring Steam popups for library page detection');
}
