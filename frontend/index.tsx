import logger from './logger.js';
import { monitorLocation } from './monitors/location.js';
import { monitorPopups } from './monitors/popups.js';
import { monitorRunningApps } from './monitors/running-apps.js';
import OnLibraryAppLoaded from './mutators/library-app.jsx';
import OnLibraryHomeLoaded from './mutators/library-home.jsx';
import rpc from './rpc.js';
import Steam from './steam.js';

export { RPC } from './rpc.js';

export default async function OnPluginLoaded() {
  // Monitor running applications to track non-steam app playtime sessions
  monitorRunningApps({
    onStart(app, instanceId) {
      // size_on_disk being '0' means it is a non-steam app
      if (app.size_on_disk !== '0') return;
      logger.debug(
        `Non-steam app ${app.display_name} launched, starting session...`,
        { app, instanceId },
      );
      rpc.OnNonSteamAppStart(app, instanceId);
    },

    onStill(app, instanceId) {
      if (app.size_on_disk !== '0') return;
      logger.debug(
        `Non-steam app ${app.display_name} still running, pinging session...`,
        { app, instanceId },
      );
      rpc.OnNonSteamAppStill(app, instanceId);

      if (
        `/library/app/${app.appid}` ===
        Steam.MainWindowBrowserManager.m_lastLocation.pathname
      ) {
        const popup = Steam.PopupManager.GetExistingPopup(
          Steam.MainWindowName,
        )!;
        logger.debug(
          'Library app page detected, refreshing mutation...', //
          { app, popup },
        );
        OnLibraryAppLoaded(popup.window!, app);
      }
    },

    onStop(app, instanceId) {
      if (app.size_on_disk !== '0') return;
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

  // Monitor Steam popups to detect when library pages are loaded
  monitorPopups({
    async onCreated(popup) {
      if (popup.title !== 'Steam') return;

      monitorLocation({
        onChange(location) {
          if (location.pathname === '/library/home') {
            logger.debug('Library home page detected');
            OnLibraryHomeLoaded();
          } else if (location.pathname.startsWith('/library/app/')) {
            const [, , , appId] = location.pathname.split('/');
            const app = Steam.AppStore.allApps //
              .find((a) => a.appid === Number(appId))!;
            logger.debug('Library app page detected', { app });
            OnLibraryAppLoaded(popup.window!, app);
          }
        },
      });
      logger.info('Started monitoring location changes in Steam window');
    },
  });
  logger.info('Started monitoring Steam popups for library page detection');
}
