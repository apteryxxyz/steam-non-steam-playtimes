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
  const playtime = await getPlaytime(app);

  const children = [
    playtime.lastPlayedAt ? (
      <LastPlayed key={app.display_name} lastPlayedAt={playtime.lastPlayedAt} />
    ) : null,
    playtime.forever ? (
      <Playtime key={app.display_name} playtime={playtime.forever} />
    ) : null,
  ].map(renderComponent);

  if (!children.filter(Boolean).length) return;

  for (const parent of await querySelectorAll(
    window.document,
    `.${PlayBarClasses.GameStatsSection}`,
  ))
    parent.append(...children);
}
