import { Millennium } from '@steambrew/client';
import { jsonReviver, type Tuple } from './helpers.js';
import type Steam from './steam.js';
import logger from './logger.js';

export class RPC {
  #call<R>(route: string, payload: object): Promise<R> {
    // Millennium build step for callable uses find and replace which doesn't always work
    // (Sometimes the client variable will be called client$1 if you have another variable called client)
    return Millennium.callServerMethod(route, payload) //
      .then((r) => JSON.parse(r, jsonReviver));
  }

  async OnAppStart(app: Steam.AppOverview, instanceId: string) {
    if (app.size_on_disk !== '0') return;
    logger.info(
      `Non-steam app ${app.display_name} launched, starting session...`,
    );
    return void this.#call('RPC.OnAppStart', {
      app_name: app.display_name,
      instance_id: instanceId,
    });
  }

  async OnAppPing(app: Steam.AppOverview, instanceId: string) {
    if (app.size_on_disk !== '0') return;
    return void this.#call('RPC.OnAppPing', {
      app_name: app.display_name,
      instance_id: instanceId,
    });
  }

  async OnAppStop(app: Steam.AppOverview, instanceId: string) {
    if (app.size_on_disk !== '0') return;
    logger.info(
      `Non-steam app ${app.display_name} stopped, stopping session...`,
    );
    return void this.#call('RPC.OnAppStop', {
      app_name: app.display_name,
      instance_id: instanceId,
    });
  }

  async GetPlaytimes<T extends readonly string[]>(appNames: T) {
    if (appNames.length === 0) return [];
    const timings = await this.#call<any[]>('RPC.GetPlaytimes', {
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
