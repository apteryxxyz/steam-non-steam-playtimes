import type Steam from '../steam.js';
import { querySelectorAll, renderComponent } from '../helpers.js';
import { LastPlayed, PlayBarClasses, Playtime } from './play-bar.js';
import rpc from '../rpc.js';

export default async function OnLibraryAppLoaded(
  window: Window,
  app: Steam.AppOverview,
) {
  // size_on_disk being '0' means it is a non-steam app
  if (app.size_on_disk !== '0') return;

  // I tried using app.minutes_playtime_forever and such but the stats didn't appear after the first render (???)
  const [{ minutesForever, lastPlayedAt }] = //
    await rpc.GetPlaytimes([app.display_name] as const);

  const parents = await querySelectorAll(
    window.document,
    `.${PlayBarClasses.GameStatsSection}`,
  );

  for (const parent of parents) {
    if (lastPlayedAt) {
      parent.querySelector('[data-nsp=last-played]')?.remove();
      const component = <LastPlayed lastPlayedAt={lastPlayedAt} />;
      const element = renderComponent(component);
      element.setAttribute('data-nsp', 'last-played');
      parent.appendChild(element);
    }

    if (minutesForever > 0) {
      parent.querySelector('[data-nsp=playtime]')?.remove();
      const component = <Playtime minutesForever={minutesForever} />;
      const element = renderComponent(component);
      element.setAttribute('data-nsp', 'playtime');
      parent.appendChild(element);
    }
  }
}
