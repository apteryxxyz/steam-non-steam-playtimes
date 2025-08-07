import { beforePatch } from '@steambrew/client';
import rpc from '../rpc.js';
import Steam from '../steam.js';
import { NON_STEAM_APP_APPID_MASK } from '../constants.js';

beforePatch(
  Steam.CollectionStore,
  'OnAppOverviewChange',
  // @ts-ignore
  async function (this: Steam.CollectionStore, [apps]: [Steam.AppOverview[]]) {
    const nonSteamApps = apps.filter((a) => a.appid > NON_STEAM_APP_APPID_MASK);
    const playTimings = await rpc.GetPlaytimes(
      nonSteamApps.map((a) => a.display_name),
    );

    for (let i = 0; i < nonSteamApps.length; i++) {
      const app = nonSteamApps[i]!;
      const playtime = playTimings[i]!;

      app.minutes_playtime_forever = playtime.minutesForever;
      app.minutes_playtime_last_two_weeks = playtime.minutesLastTwoWeeks;
      app.rt_last_time_played = (playtime.lastPlayedAt?.getTime() ?? 0) / 1000;
    }
  },
);

export default async function OnLibraryHomeLoaded() {}
