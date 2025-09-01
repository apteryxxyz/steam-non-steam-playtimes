import { beforePatch } from '@steambrew/client';
import { NON_STEAM_APP_APPID_MASK } from '../constants.js';
import logger from '../logger.js';
import rpc from '../rpc.js';
import Steam from '../steam.js';

export function register() {
  const patch = beforePatch(
    Steam.CollectionStore,
    'OnAppOverviewChange',
    // @ts-expect-error - beforePatch doesn't have good typings
    async function (
      this: Steam.CollectionStore,
      [apps]: [Steam.AppOverview[]],
    ) {
      const nonSteamApps = apps //
        .filter((a) => a.appid > NON_STEAM_APP_APPID_MASK);
      const appNames = nonSteamApps.map((a) => a.display_name);
      const playTimings = await rpc.GetPlaytimes(appNames);

      for (let i = 0; i < nonSteamApps.length; i++) {
        const app = nonSteamApps[i]!;
        const playtime = playTimings[i]!;

        app.minutes_playtime_forever = playtime.minutesForever;
        app.minutes_playtime_last_two_weeks = playtime.minutesLastTwoWeeks;
        app.rt_last_time_played =
          (playtime.lastPlayedAt?.getTime() ?? 0) / 1000;
      }
    },
  );

  logger.debug('Registered library home patch', { patch });

  return patch.unpatch;
}
