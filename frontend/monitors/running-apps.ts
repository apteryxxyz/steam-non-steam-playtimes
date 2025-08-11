import { MONITOR_RUNNING_APPS_POLL_INTERVAL } from '../constants.js';
import Steam from '../steam.js';

/**
 * Monitor the running applications that have been launched via Steam
 * @param options Options for the monitor
 */
export function monitorRunningApps({
  onStart,
  onStill,
  onStop,
  signal,
}: {
  onStart?: (app: Steam.AppOverview, instanceId: string) => Promise<void>;
  onStill?: (app: Steam.AppOverview, instanceId: string) => Promise<void>;
  onStop?: (app: Steam.AppOverview, instanceId: string) => Promise<void>;
  signal?: AbortSignal;
}) {
  const instanceIds = new Map<string, string>();

  const monitor = setInterval(() => {
    if (signal?.aborted) return clearInterval(monitor);

    const currentApps = new Set(Steam.UIStore.RunningApps);
    const seenAppNames = new Set<string>();

    for (const app of currentApps) {
      seenAppNames.add(app.display_name);

      if (!instanceIds.has(app.display_name)) {
        const instanceId = Math.random().toString(36).slice(2);
        instanceIds.set(app.display_name, instanceId);
        onStart?.(app, instanceId)?.catch(console.error);
      }

      const instanceId = instanceIds.get(app.display_name)!;
      onStill?.(app, instanceId)?.catch(console.error);
    }

    for (const [name, instanceId] of instanceIds) {
      if (!seenAppNames.has(name)) {
        instanceIds.delete(name);
        const app = Steam.AppStore.allApps //
          .find((a) => a.display_name === name)!;
        onStop?.(app, instanceId)?.catch(console.error);
      }
    }
  }, MONITOR_RUNNING_APPS_POLL_INTERVAL);
}
