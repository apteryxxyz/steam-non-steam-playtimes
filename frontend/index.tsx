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
  monitorRunningApps({
    onStart: rpc.OnAppStart.bind(rpc),
    onStill: rpc.OnAppPing.bind(rpc),
    onStop: rpc.OnAppStop.bind(rpc),
  });
  logger.info('Monitoring running apps...');

  monitorPopups({
    async onCreated(popup) {
      if (popup.title !== 'Steam') return;
      monitorLocation({
        onChange(location) {
          if (location.pathname === '/library/home') {
            OnLibraryHomeLoaded();
          } else if (location.pathname.startsWith('/library/app/')) {
            const [, , , appId] = location.pathname.split('/');
            const app = Steam.AppStore.allApps //
              .find((a) => a.appid === Number(appId))!;
            OnLibraryAppLoaded(popup.window!, app);
          }
        },
      });
      logger.info('Monitoring active location...');
    },
  });
  logger.info('Monitoring popups...');
}
