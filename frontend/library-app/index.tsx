import { querySelectorAll, renderComponent } from '../helpers.js';
import { getPlaytime } from '../rpc.js';
import Steam from '../steam.js';
import { LastPlayed, PlayBarClasses, Playtime } from './play-bar.js';

export default async function OnLibraryAppLoaded(
  window: Window,
  pathname: string,
) {
  const [, , , id] = pathname.split('/');
  const app = Steam.AppStore.allApps.find((a) => a.appid === Number(id))!;

  // size_on_disk being '0' means it is a non-steam app
  if (app.size_on_disk === '0') await patchPlayBar(window, app);
}

async function patchPlayBar(window: Window, app: Steam.AppOverview) {
  const { lastPlayedAt, forever } = await getPlaytime(app);

  const parents = await querySelectorAll(
    window.document,
    `.${PlayBarClasses.GameStatsSection}`,
  );

  for (const parent of parents) {
    if (lastPlayedAt) {
      parent.querySelector('[data-nsp-last-played]')?.remove();
      const component = <LastPlayed lastPlayedAt={lastPlayedAt} />;
      const element = renderComponent(component);
      element.setAttribute('data-nsp-last-played', 'true');
      parent.append(element);
    }

    if (forever) {
      parent.querySelector('[data-nsp-playtime]')?.remove();
      const component = <Playtime playtime={forever} />;
      const element = renderComponent(component);
      element.setAttribute('data-nsp-playtime', 'true');
      parent.append(element);
    }
  }
}
