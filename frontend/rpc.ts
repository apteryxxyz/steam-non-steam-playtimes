import { Millennium } from '@steambrew/client';
import { jsonReplacer, jsonReviver, type Tuple } from './helpers.js';
import type Steam from './steam.js';

/**
 * Call a method on the server
 * @param route The route to call, must be prefixed with `RPC.`
 * @param payload The payload to send
 * @returns The response from the server
 */
function call<R>(route: `RPC.${string}`, payload: object): Promise<R> {
  // Millennium build step for callable uses find and replace which doesn't always work
  // (Sometimes the client variable will be called client$1 if you have another variable called client)
  return Millennium.callServerMethod(route, {
    payload: JSON.stringify(payload, jsonReplacer),
  }).then((r) => JSON.parse(r, jsonReviver));
}

export class RPC {
  async OnNonSteamAppStart(app: Steam.AppOverview, instanceId: string) {
    await call('RPC.OnNonSteamAppStart', {
      app_name: app.display_name,
      instance_id: instanceId,
    });
  }

  async OnNonSteamAppStill(app: Steam.AppOverview, instanceId: string) {
    await call('RPC.OnNonSteamAppStill', {
      app_name: app.display_name,
      instance_id: instanceId,
    });
  }

  async OnNonSteamAppStop(app: Steam.AppOverview, instanceId: string) {
    await call('RPC.OnNonSteamAppStop', {
      app_name: app.display_name,
      instance_id: instanceId,
    });
  }

  async GetPlaytimes<T extends readonly string[]>(appNames: T) {
    if (appNames.length === 0) return [];
    const timings = await call<any[]>('RPC.GetPlaytimes', {
      app_names: appNames,
    });
    const formatted = timings.map((t) => ({
      minutesForever: Math.round(t.minutes_forever),
      minutesLastTwoWeeks: Math.round(t.minutes_last_two_weeks),
      lastPlayedAt: t.last_played_at as Date | null,
    }));
    return formatted as Tuple<(typeof formatted)[number], T['length']>;
  }
}

export default new RPC();
