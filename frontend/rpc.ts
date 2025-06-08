import { Millennium } from '@steambrew/client';
import type Steam from './steam.js';
import logger from './logger.js';

function call(route: string, p: object): Promise<any> {
  return Millennium.callServerMethod(route, p).then((r) => JSON.parse(r));
}

export async function getPlaytime(app: Steam.AppOverview) {
  const playtime = await call('GetPlaytime', { app_name: app.display_name });
  return {
    forever: Math.round(playtime.forever),
    lastTwoWeeks: Math.round(playtime.last_two_weeks),
    lastPlayedAt: playtime.last_played_at
      ? new Date(playtime.last_played_at)
      : null,
  };
}

export async function onAppStart(app: Steam.AppOverview, instanceId: string) {
  if (app.size_on_disk !== '0') return;
  logger.info(
    `Non-steam app ${app.display_name} launched, starting session...`,
  );
  return void call('OnAppStart', {
    app_name: app.display_name,
    instance_id: instanceId,
  });
}

export function onAppPing(app: Steam.AppOverview, instanceId: string) {
  if (app.size_on_disk !== '0') return;
  return void call('OnAppPing', { instance_id: instanceId });
}

export async function onAppStop(app: Steam.AppOverview, instanceId: string) {
  if (app.size_on_disk !== '0') return;
  logger.info(`Non-steam app ${app.display_name} stopped, ending session...`);
  return void call('OnAppStop', {
    app_name: app.display_name,
    instance_id: instanceId,
  });
}
