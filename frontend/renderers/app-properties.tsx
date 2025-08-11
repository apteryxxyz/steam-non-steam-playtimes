import { beforePatch } from '@steambrew/client';
import { PlaytimePropertiesPage } from '../components/playtime-properties-page.js';
import { NON_STEAM_APP_APPID_MASK } from '../constants.js';
import { waitFor } from '../helpers.js';
import logger from '../logger.js';
import Steam from '../steam.js';

interface AppPropertiesPage {
  title: string;
  route: string;
  link: string;
  content: React.ReactNode;
}

function isAppPropertiesPage(page: unknown): page is AppPropertiesPage {
  return (
    typeof page === 'object' &&
    page !== null &&
    'route' in page &&
    typeof page.route === 'string' &&
    page.route.startsWith('/app/:appid/properties/')
  );
}

// Yes I know this isn't ideal, but it's the latest place where pages
// can be added to the app properties page, and I don't want to bother
// with mutating the DOM.

(async () => {
  // On Steam startup, Array#map is called ~15,000 times. By
  // waiting for the MainWindowBrowserManager to be ready before patching,
  // we reduce the number of calls to this patch to ~700.
  await waitFor(() => Steam.MainWindowBrowserManager);

  const patch = beforePatch(
    Array.prototype,
    'map',
    // @ts-ignore
    function (
      this: AppPropertiesPage[],
      [callback]: [AppPropertiesPage[]['map']],
    ) {
      if (
        this.length === 0 ||
        this.length > 20 ||
        !callback.toString().includes('identifier:') ||
        !this.every(isAppPropertiesPage) ||
        this.some((p) => p.route === '/app/:appid/properties/playtime')
      )
        return;

      logger.debug(
        'Intercepted Array<AppPropertiesPage>.map, appending playtime page...',
      );

      const appId = Number(this[0]!.link.split('/')[2]);
      if (Number.isNaN(appId) || appId < NON_STEAM_APP_APPID_MASK) return;
      const app = Steam.AppStore.allApps.find((a) => a.appid === appId)!;

      this.push({
        title: 'Playtime',
        route: '/app/:appid/properties/playtime',
        link: `/app/${app.appid}/properties/playtime`,
        content: <PlaytimePropertiesPage app={app} />,
      });
    },
  );
  logger.info('Applied Array#map patch', patch);
})();

export default function OnAppPropertiesLoaded() {}
