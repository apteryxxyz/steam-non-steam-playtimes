import { NON_STEAM_APP_APPID_MASK } from './constants.js';
import logger from './logger.js';
import { monitorLocation } from './monitors/location.js';
import { monitorPopups } from './monitors/popups.js';
import { monitorRunningApps } from './monitors/running-apps.js';
import OnLibraryAppLoaded from './renderers/library-app.js';
import OnLibraryHomeLoaded from './renderers/library-home.js';
import rpc from './rpc.js';
import Steam from './steam.js';

export { RPC } from './rpc.js';

export default async function OnPluginLoaded() {
  // ===== Monitor Running Apps ===== //
  // Monitor running applications to track non-steam app playtime sessions

  monitorRunningApps({
    async onStart(app, instanceId) {
      if (app.appid < NON_STEAM_APP_APPID_MASK) return;
      logger.debug(
        `Non-steam app ${app.display_name} launched, starting session...`,
        { app, instanceId },
      );
      rpc.OnNonSteamAppStart(app, instanceId);
    },

    async onStill(app, instanceId) {
      if (app.appid < NON_STEAM_APP_APPID_MASK) return;
      logger.debug(
        `Non-steam app ${app.display_name} still running, pinging session...`,
        { app, instanceId },
      );
      rpc.OnNonSteamAppStill(app, instanceId);

      const isOnLibraryAppPage =
        Steam.MainWindowBrowserManager?.m_lastLocation?.pathname ===
        `/library/app/${app.appid}`;
      if (isOnLibraryAppPage) {
        const popup = Steam.PopupManager.GetExistingPopup(Steam.MainWindowName);
        if (popup?.window) {
          logger.debug(
            'Library app page detected, refreshing mutation...', //
            { app, popup },
          );
          OnLibraryAppLoaded(popup.window, app);
        }
      }
    },

    async onStop(app, instanceId) {
      if (app.appid < NON_STEAM_APP_APPID_MASK) return;
      logger.debug(
        `Non-steam app ${app.display_name} stopped, stopping session...`,
        { app, instanceId },
      );
      rpc.OnNonSteamAppStop(app, instanceId);
    },
  });

  logger.info(
    'Started monitoring running apps for non-steam playtime tracking',
  );

  // ===== Monitor Steam Popups ===== //
  // Monitor Steam popups to detect when library pages are loaded

  monitorPopups({
    async onCreate(popup) {
      if (popup.title === 'Steam') {
        // ===== Monitor Main Window Location ===== //

        monitorLocation({
          async onChange(location) {
            const { pathname } = location;

            if (pathname === '/library/home') {
              logger.debug('Library home page detected');
              OnLibraryHomeLoaded();
            }
            //
            else if (pathname.startsWith('/library/app/')) {
              const appId = Number(pathname.split('/')[3]);
              const app = Steam.AppStore.allApps //
                .find((a) => a.appid === appId)!;

              logger.debug('Library app page detected', { app });
              OnLibraryAppLoaded(popup.window!, app);
            }
          },
        });

        logger.info('Started monitoring location changes in Steam window');
      }
    },
  });

  logger.info('Started monitoring Steam popups for library page detection');
}
